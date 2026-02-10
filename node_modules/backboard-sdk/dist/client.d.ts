/**
 * Backboard API JavaScript/TypeScript client
 */
import { Assistant, Document, MessageResponse, ToolOutputsResponse } from './models.js';
interface BackboardClientOptions {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}
export interface ListOptions {
    skip?: number;
    limit?: number;
}
export interface AddMessageOptions {
    content?: string;
    files?: string[];
    llm_provider?: string;
    model_name?: string;
    llmProvider?: string;
    modelName?: string;
    stream?: boolean;
    memory?: string;
    role?: string;
}
export interface ToolOutput {
    tool_call_id?: string;
    toolCallId?: string;
    output: string;
}
export interface AddMemoryOptions {
    content: string;
    metadata?: unknown;
}
export interface UpdateMemoryOptions {
    content: string;
    metadata?: unknown;
}
/**
 * Backboard API client for building conversational AI applications
 * with persistent memory and intelligent document processing.
 */
export declare class BackboardClient {
    private apiKey;
    private baseUrl;
    private timeout;
    constructor(options: BackboardClientOptions);
    /**
     * Make HTTP request with error handling
     */
    private _makeRequest;
    /**
     * Handle error responses from the API
     */
    private _handleErrorResponse;
    /**
     * Parse Server-Sent Events streaming response
     */
    private _parseStreamingResponse;
    createAssistant(options: {
        name: string;
        description?: string;
        system_prompt?: string;
        tools?: any[];
        embedding_provider?: string;
        embedding_model_name?: string;
        embedding_dims?: number;
    }): Promise<Assistant>;
    listAssistants({ skip, limit }?: ListOptions): Promise<Assistant[]>;
    getAssistant(assistantId: string): Promise<Assistant>;
    updateAssistant(assistantId: string, { name, description, system_prompt, tools }?: {
        name?: string;
        description?: string;
        system_prompt?: string;
        tools?: any[];
    }): Promise<Assistant>;
    deleteAssistant(assistantId: string): Promise<any>;
    createThread(assistantId: string): Promise<any>;
    listThreadsForAssistant(assistantId: string, { skip, limit }?: ListOptions): Promise<any[]>;
    listThreads({ skip, limit }?: ListOptions): Promise<any[]>;
    getThread(threadId: string): Promise<any>;
    deleteThread(threadId: string): Promise<any>;
    addMessage(threadId: string, options?: AddMessageOptions): Promise<MessageResponse | AsyncGenerator<any>>;
    submitToolOutputs(threadId: string, runId: string, toolOutputs: ToolOutput[], stream?: boolean): Promise<ToolOutputsResponse | AsyncGenerator<any>>;
    uploadDocumentToAssistant(assistantId: string, filePath: string): Promise<Document>;
    uploadDocumentToThread(threadId: string, filePath: string): Promise<Document>;
    listAssistantDocuments(assistantId: string): Promise<Document[]>;
    listThreadDocuments(threadId: string): Promise<Document[]>;
    getDocumentStatus(documentId: string): Promise<Document>;
    deleteDocument(documentId: string): Promise<any>;
    getMemories(assistantId: string): Promise<any>;
    addMemory(assistantId: string, { content, metadata }: AddMemoryOptions): Promise<any>;
    getMemory(assistantId: string, memoryId: string): Promise<any>;
    updateMemory(assistantId: string, memoryId: string, { content, metadata }: UpdateMemoryOptions): Promise<any>;
    deleteMemory(assistantId: string, memoryId: string): Promise<any>;
    getMemoryStats(assistantId: string): Promise<any>;
}
export {};
//# sourceMappingURL=client.d.ts.map