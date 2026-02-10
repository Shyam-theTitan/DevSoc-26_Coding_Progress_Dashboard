/**
 * Backboard API data models and utilities
 */
export declare enum DocumentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    INDEXED = "indexed",
    FAILED = "failed"
}
export declare enum MessageRole {
    USER = "user",
    ASSISTANT = "assistant",
    SYSTEM = "system"
}
export interface ToolParameters {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
}
export interface ToolFunction {
    name: string;
    description?: string;
    parameters: ToolParameters;
}
export interface ToolDefinition {
    type?: string;
    function: ToolFunction;
}
export interface Assistant {
    assistantId: string;
    name: string;
    description?: string;
    systemPrompt?: string;
    tools: ToolDefinition[] | null;
    tokK?: number;
    embedding_provider?: string;
    embedding_model_name?: string;
    embedding_dims?: number;
    createdAt: Date;
}
export interface AttachmentInfo {
    documentId: string;
    filename: string;
    status: string;
    fileSizeBytes?: number;
    summary?: string;
}
export interface Message {
    messageId: string;
    role: MessageRole | string;
    content: string;
    createdAt: Date;
    status?: string;
    metadata?: unknown;
    attachments: AttachmentInfo[] | null;
}
export interface LatestMessageInfo {
    metadata?: unknown;
    modelProvider?: string;
    modelName?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    createdAt: Date | null;
}
export interface Thread {
    threadId: string;
    createdAt: Date;
    messages: Message[];
    metadata?: unknown;
}
export interface Document {
    documentId: string;
    filename: string;
    status: string;
    createdAt: Date;
    statusMessage?: string;
    summary?: string;
    updatedAt?: Date | null;
    fileSizeBytes?: number;
    totalTokens?: number;
    chunkCount?: number;
    processingStartedAt?: Date | null;
    processingCompletedAt?: Date | null;
    documentType?: string;
    metadata?: unknown;
}
export interface ToolCallFunction {
    name: string;
    arguments: string;
    parsedArguments: Record<string, unknown>;
}
export interface ToolCall {
    id: string;
    type: string;
    function: ToolCallFunction;
}
export interface MessageResponse {
    message: string;
    threadId: string;
    content: string;
    messageId: string;
    role: string;
    status: string;
    toolCalls: ToolCall[] | null;
    runId?: string;
    memoryOperationId?: string;
    retrievedMemories?: unknown;
    retrievedFiles?: string[] | null;
    modelProvider?: string;
    modelName?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    createdAt: Date | null;
    attachments: AttachmentInfo[] | null;
    timestamp: Date;
    toString(): string;
}
export interface ToolOutputsResponse {
    message: string;
    threadId: string;
    runId: string;
    content: string;
    messageId: string;
    role: string;
    status: string;
    toolCalls: unknown;
    memoryOperationId?: string;
    retrievedMemories?: unknown;
    retrievedFiles?: string[] | null;
    modelProvider?: string;
    modelName?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    createdAt: Date | null;
    timestamp: Date;
    toString(): string;
}
export interface Memory {
    id: string;
    content: string;
    metadata?: unknown;
    score?: number;
    createdAt?: string;
    updatedAt?: string;
}
export interface MemoriesListResponse {
    memories: Memory[];
    totalCount: number;
}
export interface MemoryStats {
    totalMemories: number;
    lastUpdated?: string;
    limits?: unknown;
}
/**
 * Create an Assistant object from API response
 */
export declare function createAssistant(data: any): Assistant;
export declare function createAttachmentInfo(data: any): AttachmentInfo;
export declare function createMessage(data: any): Message;
export declare function createLatestMessageInfo(data: any): LatestMessageInfo | null;
export declare function createThread(data: any): Thread;
export declare function createDocument(data: any): Document;
export declare function createToolCallFunction(data: any): ToolCallFunction;
export declare function createToolCall(data: any): ToolCall;
export declare function createMessageResponse(data: any): MessageResponse;
/**
 * Create a ToolOutputsResponse object from API response
 */
export declare function createToolOutputsResponse(data: any): {
    [x: symbol]: () => string;
    message: any;
    threadId: any;
    runId: any;
    content: any;
    messageId: any;
    role: any;
    status: any;
    toolCalls: any;
    memoryOperationId: any;
    retrievedMemories: any;
    retrievedFiles: any;
    modelProvider: any;
    modelName: any;
    inputTokens: any;
    outputTokens: any;
    totalTokens: any;
    createdAt: Date | null;
    timestamp: Date;
    toString(): string;
};
/**
 * Convert a tool definition to API format
 * Accepts both structured tool objects and plain JSON objects
 */
export declare function toolToApiFormat(tool: any): ToolDefinition;
export declare function createMemory(data: any): Memory;
export declare function createMemoriesListResponse(data: any): MemoriesListResponse;
export declare function createMemoryStats(data: any): MemoryStats;
//# sourceMappingURL=models.d.ts.map