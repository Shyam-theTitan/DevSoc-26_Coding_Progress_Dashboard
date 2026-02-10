/**
 * Backboard API data models and utilities
 */
export var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "pending";
    DocumentStatus["PROCESSING"] = "processing";
    DocumentStatus["INDEXED"] = "indexed";
    DocumentStatus["FAILED"] = "failed";
})(DocumentStatus || (DocumentStatus = {}));
export var MessageRole;
(function (MessageRole) {
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    MessageRole["SYSTEM"] = "system";
})(MessageRole || (MessageRole = {}));
/**
 * Create an Assistant object from API response
 */
export function createAssistant(data) {
    const tools = data.tools
        ? data.tools.map((tool) => ({
            type: tool.type || 'function',
            function: {
                name: tool.function.name,
                description: tool.function.description,
                parameters: {
                    type: tool.function.parameters.type || 'object',
                    properties: tool.function.parameters.properties || {},
                    required: tool.function.parameters.required || []
                }
            }
        }))
        : null;
    return {
        assistantId: data.assistant_id,
        name: data.name,
        description: data.description,
        systemPrompt: data.system_prompt,
        tools: tools,
        tokK: data.tok_k,
        embedding_provider: data.embedding_provider,
        embedding_model_name: data.embedding_model_name,
        embedding_dims: data.embedding_dims,
        createdAt: new Date(data.created_at)
    };
}
export function createAttachmentInfo(data) {
    return {
        documentId: data.document_id,
        filename: data.filename,
        status: data.status,
        fileSizeBytes: data.file_size_bytes,
        summary: data.summary
    };
}
export function createMessage(data) {
    const attachments = data.attachments ? data.attachments.map((att) => createAttachmentInfo(att)) : null;
    return {
        messageId: data.message_id,
        role: data.role,
        content: data.content,
        createdAt: new Date(data.created_at),
        status: data.status,
        metadata: data.metadata_,
        attachments
    };
}
export function createLatestMessageInfo(data) {
    if (!data)
        return null;
    return {
        metadata: data.metadata_,
        modelProvider: data.model_provider,
        modelName: data.model_name,
        inputTokens: data.input_tokens,
        outputTokens: data.output_tokens,
        totalTokens: data.total_tokens,
        createdAt: data.created_at ? new Date(data.created_at) : null
    };
}
export function createThread(data) {
    const messages = data.messages ? data.messages.map((msg) => createMessage(msg)) : [];
    return {
        threadId: data.thread_id,
        createdAt: new Date(data.created_at),
        messages,
        metadata: data.metadata_
    };
}
export function createDocument(data) {
    return {
        documentId: data.document_id,
        filename: data.filename,
        status: data.status,
        createdAt: new Date(data.created_at),
        statusMessage: data.status_message,
        summary: data.summary,
        updatedAt: data.updated_at ? new Date(data.updated_at) : null,
        fileSizeBytes: data.file_size_bytes,
        totalTokens: data.total_tokens,
        chunkCount: data.chunk_count,
        processingStartedAt: data.processing_started_at ? new Date(data.processing_started_at) : null,
        processingCompletedAt: data.processing_completed_at ? new Date(data.processing_completed_at) : null,
        documentType: data.document_type,
        metadata: data.metadata_
    };
}
export function createToolCallFunction(data) {
    return {
        name: data.name,
        arguments: data.arguments,
        get parsedArguments() {
            try {
                return JSON.parse(this.arguments);
            }
            catch {
                return {};
            }
        }
    };
}
export function createToolCall(data) {
    return {
        id: data.id,
        type: data.type,
        function: createToolCallFunction(data.function)
    };
}
export function createMessageResponse(data) {
    const attachments = data.attachments ? data.attachments.map((att) => createAttachmentInfo(att)) : null;
    const toolCalls = data.tool_calls ? data.tool_calls.map((tc) => createToolCall(tc)) : null;
    const response = {
        message: data.message,
        threadId: data.thread_id,
        content: data.content,
        messageId: data.message_id,
        role: data.role,
        status: data.status,
        toolCalls,
        runId: data.run_id,
        memoryOperationId: data.memory_operation_id,
        retrievedMemories: data.retrieved_memories,
        retrievedFiles: data.retrieved_files,
        modelProvider: data.model_provider,
        modelName: data.model_name,
        inputTokens: data.input_tokens,
        outputTokens: data.output_tokens,
        totalTokens: data.total_tokens,
        createdAt: data.created_at ? new Date(data.created_at) : null,
        attachments,
        timestamp: new Date(data.timestamp),
        toString() {
            return `MessageResponse(
  message='${this.message}',
  threadId='${this.threadId}',
  content='${this.content}',
  messageId='${this.messageId}',
  role='${this.role}',
  status='${this.status}',
  toolCalls=${JSON.stringify(this.toolCalls)},
  runId='${this.runId}',
  retrievedFiles=${JSON.stringify(this.retrievedFiles)},
  modelProvider='${this.modelProvider}',
  modelName='${this.modelName}',
  inputTokens=${this.inputTokens},
  outputTokens=${this.outputTokens},
  totalTokens=${this.totalTokens},
  createdAt='${this.createdAt ? this.createdAt.toISOString() : null}',
  attachments=${JSON.stringify(this.attachments)},
  timestamp='${this.timestamp.toISOString()}'
)`;
        },
        [Symbol.for('nodejs.util.inspect.custom')]() {
            return this.toString();
        }
    };
    return response;
}
/**
 * Create a ToolOutputsResponse object from API response
 */
export function createToolOutputsResponse(data) {
    const toolCalls = data.tool_calls ?
        data.tool_calls.map((tc) => createToolCall(tc)) : null;
    const response = {
        message: data.message,
        threadId: data.thread_id,
        runId: data.run_id,
        content: data.content,
        messageId: data.message_id,
        role: data.role,
        status: data.status,
        toolCalls: toolCalls,
        memoryOperationId: data.memory_operation_id,
        retrievedMemories: data.retrieved_memories,
        retrievedFiles: data.retrieved_files,
        modelProvider: data.model_provider,
        modelName: data.model_name,
        inputTokens: data.input_tokens,
        outputTokens: data.output_tokens,
        totalTokens: data.total_tokens,
        createdAt: data.created_at ? new Date(data.created_at) : null,
        timestamp: new Date(data.timestamp),
        toString() {
            return `ToolOutputsResponse(
  message='${this.message}',
  threadId='${this.threadId}',
  runId='${this.runId}',
  content='${this.content}',
  messageId='${this.messageId}',
  role='${this.role}',
  status='${this.status}',
  toolCalls=${JSON.stringify(this.toolCalls)},
  retrievedFiles=${JSON.stringify(this.retrievedFiles)},
  modelProvider='${this.modelProvider}',
  modelName='${this.modelName}',
  inputTokens=${this.inputTokens},
  outputTokens=${this.outputTokens},
  totalTokens=${this.totalTokens},
  createdAt='${this.createdAt ? this.createdAt.toISOString() : null}',
  timestamp='${this.timestamp.toISOString()}'
)`;
        },
        [Symbol.for('nodejs.util.inspect.custom')]() {
            return this.toString();
        }
    };
    return response;
}
/**
 * Convert a tool definition to API format
 * Accepts both structured tool objects and plain JSON objects
 */
export function toolToApiFormat(tool) {
    if (tool.type && tool.function && tool.function.name) {
        return tool;
    }
    return {
        type: tool.type || 'function',
        function: {
            name: tool.function.name,
            description: tool.function.description,
            parameters: {
                type: tool.function.parameters.type || 'object',
                properties: tool.function.parameters.properties || {},
                required: tool.function.parameters.required || []
            }
        }
    };
}
export function createMemory(data) {
    return {
        id: data.id,
        content: data.content,
        metadata: data.metadata,
        score: data.score,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
}
export function createMemoriesListResponse(data) {
    const memories = data.memories ? data.memories.map((mem) => createMemory(mem)) : [];
    return {
        memories,
        totalCount: data.total_count
    };
}
export function createMemoryStats(data) {
    return {
        totalMemories: data.total_memories || 0,
        lastUpdated: data.last_updated,
        limits: data.limits
    };
}
//# sourceMappingURL=models.js.map