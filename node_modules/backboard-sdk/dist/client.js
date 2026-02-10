/**
 * Backboard API JavaScript/TypeScript client
 */
import fetch, { Response } from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { BackboardAPIError, BackboardNotFoundError, BackboardRateLimitError, BackboardServerError, BackboardValidationError } from './errors.js';
import { createAssistant, createDocument, createMemoriesListResponse, createMemory, createMemoryStats, createMessageResponse, createThread, createToolOutputsResponse, toolToApiFormat } from './models.js';
const SDK_VERSION = '1.4.11';
/**
 * Backboard API client for building conversational AI applications
 * with persistent memory and intelligent document processing.
 */
export class BackboardClient {
    constructor(options) {
        if (!options || !options.apiKey) {
            throw new Error('API key is required');
        }
        this.apiKey = options.apiKey;
        this.baseUrl = (options.baseUrl || 'https://app.backboard.io/api').replace(/\/$/, '');
        this.timeout = options.timeout || 30000;
    }
    /**
     * Make HTTP request with error handling
     */
    async _makeRequest(method, endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
        const headers = {
            'X-API-Key': this.apiKey,
            'User-Agent': `backboard-js-sdk/${SDK_VERSION}`,
            ...options.headers
        };
        if (options.json && !options.formData) {
            headers['Content-Type'] = 'application/json';
        }
        const requestOptions = {
            method,
            headers,
            // node-fetch supports timeout option
            timeout: this.timeout,
            ...options.fetchOptions
        };
        if (options.json) {
            requestOptions.body = JSON.stringify(options.json);
        }
        else if (options.formData) {
            requestOptions.body = options.formData;
        }
        else if (options.body) {
            requestOptions.body = options.body;
        }
        try {
            const response = await fetch(url, requestOptions);
            if (response.status >= 400) {
                await this._handleErrorResponse(response);
            }
            if (options.stream) {
                return response;
            }
            return await response.json();
        }
        catch (error) {
            if (error.name === 'AbortError') {
                throw new BackboardAPIError('Request timed out');
            }
            else if (error instanceof BackboardAPIError) {
                throw error;
            }
            else {
                throw new BackboardAPIError(`Request failed: ${error.message}`);
            }
        }
    }
    /**
     * Handle error responses from the API
     */
    async _handleErrorResponse(response) {
        let errorMessage;
        try {
            const errorData = await response.json();
            errorMessage = (errorData && errorData.detail) || `HTTP ${response.status}`;
        }
        catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        const ErrorClass = {
            400: BackboardValidationError,
            404: BackboardNotFoundError,
            429: BackboardRateLimitError
        }[response.status] || (response.status >= 500 ? BackboardServerError : BackboardAPIError);
        throw new ErrorClass(errorMessage, response.status, response);
    }
    /**
     * Parse Server-Sent Events streaming response
     */
    async *_parseStreamingResponse(response) {
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            if (response.body?.getReader) {
                const reader = response.body.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    if (data && typeof data === 'object') {
                                        const t = data.type;
                                        if (t === 'error') {
                                            const msg = data.error || data.message || 'Streaming error';
                                            throw new BackboardAPIError(msg);
                                        }
                                        if (t === 'run_failed') {
                                            const msg = data.error || data.message || 'Run failed';
                                            throw new BackboardAPIError(msg);
                                        }
                                        if (t === 'run_ended' && data.status && data.status !== 'completed') {
                                            throw new BackboardAPIError(`Run ended with status: ${data.status}`);
                                        }
                                    }
                                    yield data;
                                }
                                catch (err) {
                                    if (err instanceof BackboardAPIError) {
                                        throw err;
                                    }
                                    continue;
                                }
                            }
                        }
                    }
                }
                finally {
                    reader.releaseLock();
                }
            }
            else {
                for await (const chunk of response.body) {
                    buffer += decoder.decode(chunk, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data && typeof data === 'object') {
                                    const t = data.type;
                                    if (t === 'error') {
                                        const msg = data.error || data.message || 'Streaming error';
                                        throw new BackboardAPIError(msg);
                                    }
                                    if (t === 'run_failed') {
                                        const msg = data.error || data.message || 'Run failed';
                                        throw new BackboardAPIError(msg);
                                    }
                                    if (t === 'run_ended' && data.status && data.status !== 'completed') {
                                        throw new BackboardAPIError(`Run ended with status: ${data.status}`);
                                    }
                                }
                                yield data;
                            }
                            catch (err) {
                                if (err instanceof BackboardAPIError) {
                                    throw err;
                                }
                                continue;
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            throw new Error(`Streaming response parsing failed: ${error.message}`);
        }
    }
    // Assistant methods
    async createAssistant(options) {
        const { name, description, system_prompt, tools, embedding_provider, embedding_model_name, embedding_dims } = options;
        // Backwards-compat: historically some users used `description` as the system prompt.
        // Prefer `system_prompt` when provided.
        const resolvedSystemPrompt = system_prompt ?? description;
        const data = { name };
        if (description)
            data.description = description;
        if (resolvedSystemPrompt !== undefined)
            data.system_prompt = resolvedSystemPrompt;
        if (tools)
            data.tools = tools.map((tool) => toolToApiFormat(tool));
        if (embedding_provider)
            data.embedding_provider = embedding_provider;
        if (embedding_model_name)
            data.embedding_model_name = embedding_model_name;
        if (embedding_dims)
            data.embedding_dims = embedding_dims;
        const response = await this._makeRequest('POST', '/assistants', { json: data });
        return createAssistant(response);
    }
    async listAssistants({ skip = 0, limit = 100 } = {}) {
        const url = `/assistants?skip=${skip}&limit=${limit}`;
        const response = await this._makeRequest('GET', url);
        return response.map((data) => createAssistant(data));
    }
    async getAssistant(assistantId) {
        const response = await this._makeRequest('GET', `/assistants/${assistantId}`);
        return createAssistant(response);
    }
    async updateAssistant(assistantId, { name, description, system_prompt, tools } = {}) {
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (description !== undefined)
            data.description = description;
        // Backwards-compat: allow `description` to update system prompt when `system_prompt` isn't provided.
        const resolvedSystemPrompt = system_prompt ?? description;
        if (resolvedSystemPrompt !== undefined)
            data.system_prompt = resolvedSystemPrompt;
        if (tools !== undefined)
            data.tools = tools.map((tool) => toolToApiFormat(tool));
        const response = await this._makeRequest('PUT', `/assistants/${assistantId}`, { json: data });
        return createAssistant(response);
    }
    async deleteAssistant(assistantId) {
        return await this._makeRequest('DELETE', `/assistants/${assistantId}`);
    }
    // Thread methods
    async createThread(assistantId) {
        const response = await this._makeRequest('POST', `/assistants/${assistantId}/threads`, { json: {} });
        return createThread(response);
    }
    async listThreadsForAssistant(assistantId, { skip = 0, limit = 100 } = {}) {
        const url = `/assistants/${assistantId}/threads?skip=${skip}&limit=${limit}`;
        const response = await this._makeRequest('GET', url);
        return response.map((data) => createThread(data));
    }
    async listThreads({ skip = 0, limit = 100 } = {}) {
        const url = `/threads?skip=${skip}&limit=${limit}`;
        const response = await this._makeRequest('GET', url);
        return response.map((data) => createThread(data));
    }
    async getThread(threadId) {
        const response = await this._makeRequest('GET', `/threads/${threadId}`);
        return createThread(response);
    }
    async deleteThread(threadId) {
        return await this._makeRequest('DELETE', `/threads/${threadId}`);
    }
    async addMessage(threadId, options = {}) {
        const { content, files, llm_provider, model_name, llmProvider, modelName, stream = false, memory, role } = options;
        const formData = new FormData();
        formData.append('stream', stream.toString());
        if (content)
            formData.append('content', content);
        const resolvedProvider = llm_provider || llmProvider;
        const resolvedModelName = model_name || modelName;
        if (resolvedProvider)
            formData.append('llm_provider', resolvedProvider);
        if (resolvedModelName)
            formData.append('model_name', resolvedModelName);
        if (memory)
            formData.append('memory', memory);
        if (role)
            formData.append('role', role);
        if (files && files.length > 0) {
            for (const filePath of files) {
                if (!fs.existsSync(filePath)) {
                    throw new Error(`File not found: ${filePath}`);
                }
                const filename = path.basename(filePath);
                const fileStream = fs.createReadStream(filePath);
                formData.append('files', fileStream, filename);
            }
        }
        const headers = typeof formData.getHeaders === 'function' ? formData.getHeaders() : {};
        const response = await this._makeRequest('POST', `/threads/${threadId}/messages`, {
            formData,
            stream,
            headers
        });
        if (stream && response instanceof Response) {
            return this._parseStreamingResponse(response);
        }
        else {
            return createMessageResponse(response);
        }
    }
    async submitToolOutputs(threadId, runId, toolOutputs, stream = false) {
        const data = {
            tool_outputs: toolOutputs.map((output) => {
                if (output.tool_call_id && output.output) {
                    return {
                        tool_call_id: output.tool_call_id,
                        output: output.output
                    };
                }
                else if (output.toolCallId && output.output) {
                    return {
                        tool_call_id: output.toolCallId,
                        output: output.output
                    };
                }
                else {
                    throw new Error('Tool output must have tool_call_id and output properties');
                }
            })
        };
        const url = `/threads/${threadId}/runs/${runId}/submit-tool-outputs${stream ? '?stream=true' : ''}`;
        const response = await this._makeRequest('POST', url, { json: data, stream });
        if (stream && response instanceof Response) {
            return this._parseStreamingResponse(response);
        }
        else {
            return createToolOutputsResponse(response);
        }
    }
    // Document methods
    async uploadDocumentToAssistant(assistantId, filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const formData = new FormData();
        const filename = path.basename(filePath);
        const fileStream = fs.createReadStream(filePath);
        formData.append('file', fileStream, filename);
        const headers = typeof formData.getHeaders === 'function' ? formData.getHeaders() : {};
        const response = await this._makeRequest('POST', `/assistants/${assistantId}/documents`, {
            formData,
            headers
        });
        return createDocument(response);
    }
    async uploadDocumentToThread(threadId, filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const formData = new FormData();
        const filename = path.basename(filePath);
        const fileStream = fs.createReadStream(filePath);
        formData.append('file', fileStream, filename);
        const headers = typeof formData.getHeaders === 'function' ? formData.getHeaders() : {};
        const response = await this._makeRequest('POST', `/threads/${threadId}/documents`, {
            formData,
            headers
        });
        return createDocument(response);
    }
    async listAssistantDocuments(assistantId) {
        const response = await this._makeRequest('GET', `/assistants/${assistantId}/documents`);
        return response.map((data) => createDocument(data));
    }
    async listThreadDocuments(threadId) {
        const response = await this._makeRequest('GET', `/threads/${threadId}/documents`);
        return response.map((data) => createDocument(data));
    }
    async getDocumentStatus(documentId) {
        const response = await this._makeRequest('GET', `/documents/${documentId}/status`);
        return createDocument(response);
    }
    async deleteDocument(documentId) {
        return await this._makeRequest('DELETE', `/documents/${documentId}`);
    }
    // Memory methods
    async getMemories(assistantId) {
        const response = await this._makeRequest('GET', `/assistants/${assistantId}/memories`);
        return createMemoriesListResponse(response);
    }
    async addMemory(assistantId, { content, metadata }) {
        const data = { content };
        if (metadata) {
            data.metadata = metadata;
        }
        return await this._makeRequest('POST', `/assistants/${assistantId}/memories`, { json: data });
    }
    async getMemory(assistantId, memoryId) {
        const response = await this._makeRequest('GET', `/assistants/${assistantId}/memories/${memoryId}`);
        return createMemory(response);
    }
    async updateMemory(assistantId, memoryId, { content, metadata }) {
        const data = { content };
        if (metadata) {
            data.metadata = metadata;
        }
        const response = await this._makeRequest('PUT', `/assistants/${assistantId}/memories/${memoryId}`, {
            json: data
        });
        return createMemory(response);
    }
    async deleteMemory(assistantId, memoryId) {
        return await this._makeRequest('DELETE', `/assistants/${assistantId}/memories/${memoryId}`);
    }
    async getMemoryStats(assistantId) {
        const response = await this._makeRequest('GET', `/assistants/${assistantId}/memories/stats`);
        return createMemoryStats(response);
    }
}
//# sourceMappingURL=client.js.map