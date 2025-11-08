/**
 * Agent Conversation Schema for MongoDB/Mongoose
 *
 * Represents a conversation session between a user and the AI agent.
 * Includes message history and action metadata for debugging and traceability.
 *
 * Scope: [MVP]
 * - Text-based conversational interface for agent-first experience
 * - Message history with role-based attribution
 * - Conversation status tracking
 *
 * Future enhancements:
 * - Voice input/output support
 * - Rich conversation analytics
 * - Detailed action logging (separate AgentActionLog collection)
 * - Conversation summary generation
 */

import { Schema } from 'mongoose';

// ============================================================================
// Constants
// ============================================================================

export const AGENT_CONVERSATION_COLLECTION_NAME = 'agent_conversations';

// Validation limits
export const MAX_MESSAGES_PER_CONVERSATION = 500; // Prevent unbounded growth
export const MAX_MESSAGE_CONTENT_LENGTH = 10000; // Maximum chars per message
export const MAX_TITLE_LENGTH = 120; // Maximum chars for conversation title
export const MAX_PREVIEW_LENGTH = 120; // Maximum chars for last message preview

// ============================================================================
// Enums
// ============================================================================

/**
 * Message sender/role
 * Indicates who sent the message
 */
export enum MessageSender {
  User = 'user', // User input
  Agent = 'agent', // AI agent response
  System = 'system', // System notification or error
}

/**
 * Conversation status
 * Tracks the lifecycle of a conversation
 */
export enum ConversationStatus {
  InProgress = 'in_progress', // Active conversation
  Completed = 'completed', // User completed goal or ended conversation
  Aborted = 'aborted', // Conversation terminated due to error or user abandonment
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * AgentMessage document type for TypeScript
 */
interface IAgentMessage {
  sender: MessageSender;
  content: string;
  createdAt: Date;
}

// ============================================================================
// Sub-document Schemas
// ============================================================================

/**
 * AgentMessage Sub-document Schema
 *
 * Represents a single message in the conversation.
 *
 * Validations:
 * - sender: enum validation (user, agent, system)
 * - content: required, max length enforced
 */
const AgentMessageSchema = new Schema(
  {
    /**
     * Message sender/role
     * - Required
     * - Enum: user, agent, system
     */
    sender: {
      type: String,
      enum: {
        values: Object.values(MessageSender),
        message: 'Invalid message sender: {VALUE}',
      },
      required: [true, 'Message sender is required'],
    },

    /**
     * Message content (text)
     * - Required
     * - Max length to prevent abuse
     * - Trimmed
     */
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [
        MAX_MESSAGE_CONTENT_LENGTH,
        `Message content must not exceed ${MAX_MESSAGE_CONTENT_LENGTH} characters`,
      ],
    },

    /**
     * Message creation timestamp
     * - Auto-generated
     * - For chronological ordering
     */
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    /**
     * Optional metadata for the message
     * [Future]: Store tool calls, actions, or other structured data
     */
    metadata: {
      type: Schema.Types.Mixed,
      // Not used in MVP - reserved for future enhancements
    },
  },
  {
    // Don't add timestamps to sub-documents
    timestamps: false,

    // Optimize JSON output
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============================================================================
// Main Agent Conversation Schema
// ============================================================================

/**
 * Agent Conversation Schema
 *
 * Validations:
 * - messages: array of AgentMessage sub-documents, max 500 messages
 * - status: enum validation, defaults to 'in_progress'
 *
 * Indexes:
 * - userId (for user's conversation history)
 * - status (for filtering active conversations)
 * - createdAt (for chronological queries)
 *
 * Business Rules:
 * - BR-3.5: Agent logs conversation and actions for debugging
 * - Messages are immutable once added
 * - Conversations can be marked completed or aborted
 */
export const AgentConversationSchema = new Schema(
  {
    /**
     * User who initiated this conversation
     * - Optional (can be null for anonymous/test conversations)
     * - ObjectId type to match User._id
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional to support test scenarios
    },

    /**
     * Conversation title
     * - Generated from first user message or explicitly set
     * - Max 120 characters
     * - Used for display in conversation history
     */
    title: {
      type: String,
      required: [true, 'Conversation title is required'],
      trim: true,
      maxlength: [
        MAX_TITLE_LENGTH,
        `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
      ],
      default: 'Untitled conversation',
    },

    /**
     * Preview of last message
     * - Used for quick context in conversation list
     * - Max 120 characters
     * - Updated when new messages are added
     */
    lastMessagePreview: {
      type: String,
      required: [true, 'Last message preview is required'],
      trim: true,
      maxlength: [
        MAX_PREVIEW_LENGTH,
        `Preview must not exceed ${MAX_PREVIEW_LENGTH} characters`,
      ],
      default: 'No messages yet',
    },

    /**
     * Chronological list of messages in the conversation
     * - Array of AgentMessage sub-documents
     * - Max 500 messages to prevent unbounded growth
     * - Ordered chronologically by createdAt
     */
    messages: {
      type: [AgentMessageSchema],
      default: [],
      validate: {
        validator: function (messages: IAgentMessage[]) {
          return messages.length <= MAX_MESSAGES_PER_CONVERSATION;
        },
        message: `Conversation cannot have more than ${MAX_MESSAGES_PER_CONVERSATION} messages`,
      },
    },

    /**
     * Conversation status
     * - Required
     * - Enum: in_progress, completed, aborted
     * - Defaults to 'in_progress'
     */
    status: {
      type: String,
      enum: {
        values: Object.values(ConversationStatus),
        message: 'Invalid conversation status: {VALUE}',
      },
      default: ConversationStatus.InProgress,
      required: true,
    },

    /**
     * Summary of the conversation goal or outcome
     * [Future]: Generated by AI agent at conversation end
     */
    summary: {
      type: String,
      trim: true,
      maxlength: [1000, 'Summary must not exceed 1000 characters'],
      // Not used in MVP - reserved for future AI-generated summaries
    },

    /**
     * Actions/tools invoked during conversation
     * [Future]: Detailed action logs (may move to separate collection)
     */
    actions: {
      type: [
        {
          actionType: {
            type: String,
            required: true,
          },
          parameters: {
            type: Schema.Types.Mixed,
          },
          result: {
            type: Schema.Types.Mixed,
          },
          error: {
            type: String,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
      // Basic action logging for MVP
      // [Future]: Move to separate AgentActionLog collection for analytics
    },
  },
  {
    // Automatic timestamps: createdAt, updatedAt
    timestamps: true,

    // Enable validation before save
    validateBeforeSave: true,

    // Collection name
    collection: AGENT_CONVERSATION_COLLECTION_NAME,

    // Optimize JSON output
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============================================================================
// Indexes
// ============================================================================

/**
 * NOTE: Explicit .index() calls are commented out to avoid Turbopack compatibility issues.
 * Indexes can be created manually via MongoDB or enabled when not using Turbopack.
 */

// Index on userId for user's conversation history
// AgentConversationSchema.index({ userId: 1 });

// Index on status for filtering conversations by status
// AgentConversationSchema.index({ status: 1 });

// Index on createdAt for chronological queries
// AgentConversationSchema.index({ createdAt: -1 }); // Descending for recent-first

// Compound index on userId + status for active user conversations
// AgentConversationSchema.index({ userId: 1, status: 1 });

// Compound index on userId + updatedAt for conversation history listing (sorted by recent)
// AgentConversationSchema.index({ userId: 1, updatedAt: -1 });

// ============================================================================
// Virtual Properties
// ============================================================================

/**
 * Virtual property: message count
 */
AgentConversationSchema.virtual('messageCount').get(function () {
  return this.messages.length;
});

/**
 * Virtual property: is conversation active
 */
AgentConversationSchema.virtual('isActive').get(function () {
  return this.status === ConversationStatus.InProgress;
});

/**
 * Virtual property: last message
 */
AgentConversationSchema.virtual('lastMessage').get(function () {
  return this.messages.length > 0
    ? this.messages[this.messages.length - 1]
    : null;
});

// Ensure virtuals are included in JSON output
AgentConversationSchema.set('toJSON', { virtuals: true });
AgentConversationSchema.set('toObject', { virtuals: true });

// ============================================================================
// Instance Methods
// ============================================================================

/**
 * Add a message to the conversation
 */
AgentConversationSchema.methods.addMessage = function (
  sender: MessageSender,
  content: string
) {
  // Check message count limit
  if (this.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
    throw new Error(
      `Cannot add message: conversation has reached maximum of ${MAX_MESSAGES_PER_CONVERSATION} messages`
    );
  }

  this.messages.push({
    sender,
    content: content.trim(),
    createdAt: new Date(),
  });

  return this.save();
};

/**
 * Add user message
 */
AgentConversationSchema.methods.addUserMessage = function (content: string) {
  return this.addMessage(MessageSender.User, content);
};

/**
 * Add agent message
 */
AgentConversationSchema.methods.addAgentMessage = function (content: string) {
  return this.addMessage(MessageSender.Agent, content);
};

/**
 * Add system message
 */
AgentConversationSchema.methods.addSystemMessage = function (content: string) {
  return this.addMessage(MessageSender.System, content);
};

/**
 * Mark conversation as completed
 */
AgentConversationSchema.methods.complete = function () {
  this.status = ConversationStatus.Completed;
  return this.save();
};

/**
 * Mark conversation as aborted
 */
AgentConversationSchema.methods.abort = function () {
  this.status = ConversationStatus.Aborted;
  return this.save();
};

/**
 * Log an agent action
 * [MVP]: Basic action logging
 */
AgentConversationSchema.methods.logAction = function (
  actionType: string,
  parameters: Record<string, unknown>,
  result?: Record<string, unknown>,
  error?: string
) {
  this.actions.push({
    actionType,
    parameters,
    result,
    error,
    timestamp: new Date(),
  });

  return this.save();
};

// ============================================================================
// Static Methods
// ============================================================================

/**
 * Find conversations by user ID
 */
AgentConversationSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Find active conversations for a user
 */
AgentConversationSchema.statics.findActiveByUserId = function (userId: string) {
  return this.find({
    userId,
    status: ConversationStatus.InProgress,
  }).sort({ createdAt: -1 });
};

/**
 * Find or create active conversation for user
 * Returns the most recent in-progress conversation or creates a new one
 */
AgentConversationSchema.statics.findOrCreateActiveForUser = async function (
  userId: string
) {
  let conversation = await this.findOne({
    userId,
    status: ConversationStatus.InProgress,
  }).sort({ createdAt: -1 });

  if (!conversation) {
    conversation = await this.create({
      userId,
      messages: [],
      status: ConversationStatus.InProgress,
    });
  }

  return conversation;
};

// ============================================================================
// Pre-save Hooks
// ============================================================================

/**
 * Pre-save hook to validate message count
 */
AgentConversationSchema.pre('save', function (next) {
  if (this.messages.length > MAX_MESSAGES_PER_CONVERSATION) {
    next(
      new Error(
        `Conversation cannot have more than ${MAX_MESSAGES_PER_CONVERSATION} messages`
      )
    );
  } else {
    next();
  }
});

/**
 * Pre-save hook to trim message content
 */
AgentConversationSchema.pre('save', function (next) {
  for (const message of this.messages as unknown as IAgentMessage[]) {
    if (message.content) {
      message.content = message.content.trim();
    }
  }
  next();
});

// ============================================================================
// Export
// ============================================================================

export default AgentConversationSchema;
