import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../api/chat';
import { tripsService } from '../../api/trips';
import moment from 'moment';

const { width } = Dimensions.get('window');

const ChatScreen = ({ navigation, route }) => {
  const { socket, isConnected, joinTrip, leaveTrip, sendMessage, sendTyping } = useSocket();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const tripId = route?.params?.tripId;

  useEffect(() => {
    if (tripId) {
      loadTripDetails();
      loadMessages();
      joinTripRoom();
    }

    return () => {
      if (tripId) {
        leaveTripRoom();
      }
    };
  }, [tripId]);

  useEffect(() => {
    if (socket) {
      setupSocketListeners();
    }

    return () => {
      if (socket) {
        socket.off('newMessage');
        socket.off('userTyping');
        socket.off('userJoined');
        socket.off('userLeft');
        socket.off('error');
      }
    };
  }, [socket]);

  const loadTripDetails = async () => {
    try {
      const response = await tripsService.getTrip(tripId);
      if (response.success) {
        setTrip(response.data.trip);
        navigation.setOptions({ title: response.data.trip.name });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load trip details');
    }
  };

  const loadMessages = async () => {
    try {
      const response = await chatService.getChatMessages(tripId);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const joinTripRoom = () => {
    if (isConnected && tripId) {
      joinTrip(tripId);
    }
  };

  const leaveTripRoom = () => {
    if (isConnected && tripId) {
      leaveTrip(tripId);
    }
  };

  const setupSocketListeners = () => {
    // Listen for new messages
    socket.on('newMessage', (data) => {
      setMessages(prev => [...prev, data.message]);
      scrollToBottom();
    });

    // Listen for typing indicators
    socket.on('userTyping', (data) => {
      if (data.user.id !== user.id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.id !== data.user.id);
          if (data.isTyping) {
            return [...filtered, data.user];
          }
          return filtered;
        });
      }
    });

    // Listen for user join/leave events
    socket.on('userJoined', (data) => {
      addSystemMessage(`${data.user.name} joined the chat`);
    });

    socket.on('userLeft', (data) => {
      addSystemMessage(`${data.user.name} left the chat`);
    });

    // Listen for errors
    socket.on('error', (data) => {
      Alert.alert('Chat Error', data.message);
    });
  };

  const addSystemMessage = (text) => {
    const systemMessage = {
      _id: Date.now().toString(),
      type: 'system',
      message: text,
      createdAt: new Date(),
      senderId: { name: 'System' }
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    const messageData = {
      tripId,
      message: newMessage.trim(),
      type: 'text'
    };

    try {
      // Send via Socket.IO for real-time delivery
      sendMessage(messageData);
      
      // Also send via API for persistence
      await chatService.sendMessage(messageData);
      
      setNewMessage('');
      stopTyping();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleTyping = (text) => {
    setNewMessage(text);
    
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      sendTyping(tripId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      sendTyping(tripId, false);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleMessageLongPress = (message) => {
    if (message.senderId._id === user.id && message.type === 'text') {
      setSelectedMessage(message);
    }
  };

  const handleEditMessage = async () => {
    if (!selectedMessage) return;
    
    Alert.prompt(
      'Edit Message',
      'Enter new message:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (newText) => {
            if (newText && newText.trim()) {
              try {
                await chatService.editMessage(selectedMessage._id, newText.trim());
                setMessages(prev => prev.map(msg => 
                  msg._id === selectedMessage._id 
                    ? { ...msg, message: newText.trim(), isEdited: true, editedAt: new Date() }
                    : msg
                ));
              } catch (error) {
                Alert.alert('Error', 'Failed to edit message');
              }
            }
          }
        }
      ],
      'plain-text',
      selectedMessage.message
    );
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.deleteMessage(selectedMessage._id);
              setMessages(prev => prev.filter(msg => msg._id !== selectedMessage._id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
    setSelectedMessage(null);
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await chatService.addReaction(messageId, emoji);
      // Update local state
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          const existingReaction = msg.reactions?.find(r => r.user._id === user.id && r.emoji === emoji);
          if (!existingReaction) {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), { user: user, emoji, createdAt: new Date() }]
            };
          }
        }
        return msg;
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to add reaction');
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId._id === user.id;
    const showAvatar = index === 0 || messages[index - 1].senderId._id !== item.senderId._id;
    const isSystemMessage = item.type === 'system';

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.message}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage
        ]}
        onLongPress={() => handleMessageLongPress(item)}
        activeOpacity={0.7}
      >
        {!isMyMessage && showAvatar && (
          <Image
            source={{ uri: item.senderId.avatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          !isMyMessage && !showAvatar && styles.messageWithoutAvatar
        ]}>
          {!isMyMessage && showAvatar && (
            <Text style={styles.senderName}>{item.senderId.name}</Text>
          )}
          
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          
          {item.isEdited && (
            <Text style={styles.editedLabel}>(edited)</Text>
          )}
          
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {moment(item.createdAt).format('HH:mm')}
          </Text>
          
          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {item.reactions.map((reaction, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.reaction}
                  onPress={() => handleReaction(item._id, reaction.emoji)}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text style={styles.reactionCount}>
                    {item.reactions.filter(r => r.emoji === reaction.emoji).length}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>
          {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        Start the conversation with your travel companions!
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9C27B0" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={messages.length === 0 ? styles.emptyContainer : styles.messagesList}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={loadMessages} />
          }
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />
        
        {renderTypingIndicator()}
        
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={handleTyping}
              placeholder="Type a message..."
              multiline
              maxLength={1000}
              onBlur={stopTyping}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || !isConnected) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={(!newMessage.trim() || !isConnected) ? '#ccc' : '#fff'} 
              />
            </TouchableOpacity>
          </View>
          
          {!isConnected && (
            <Text style={styles.connectionStatus}>Connecting...</Text>
          )}
        </View>
      </View>

      {/* Message Options Modal */}
      <Modal
        visible={!!selectedMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMessage(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedMessage(null)}
        >
          <View style={styles.messageOptions}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleEditMessage}
            >
              <Ionicons name="create-outline" size={20} color="#333" />
              <Text style={styles.optionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleDeleteMessage}
            >
              <Ionicons name="trash-outline" size={20} color="#e74c3c" />
              <Text style={[styles.optionText, { color: '#e74c3c' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  chatContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#9C27B0',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageWithoutAvatar: {
    marginLeft: 40,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  editedLabel: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: '#999',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    marginLeft: 2,
    color: '#666',
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    backgroundColor: '#9C27B0',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  connectionStatus: {
    fontSize: 12,
    color: '#ff9800',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageOptions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
});

export default ChatScreen;
