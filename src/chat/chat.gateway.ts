import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { NestGateway } from '@nestjs/websockets/interfaces/nest-gateway.interface';
import { ChatService } from './chat.service';
import { Bind, UseInterceptors } from '@nestjs/common';
import { Chat } from './chat.entity';

@WebSocketGateway()
export class ChatGateway implements NestGateway {
  constructor(private chatService: ChatService) { }

  afterInit(server: any) {
    // console.log('Init', server);
  }

  handleConnection(socket: any) {
    const query = socket.handshake.query;
    console.log('Connect', query);
    this.chatService.userConnected(query.userName, query.registrationToken);
    process.nextTick(async () => {
      socket.emit('allChats', await this.chatService.getChats());
    });
  }

  handleDisconnect(socket: any) {
    const query = socket.handshake.query;
    console.log('Disconnect', socket.handshake.query);
    this.chatService.userDisconnected(query.userName);
  }

  @Bind(MessageBody(), ConnectedSocket())
  @SubscribeMessage('chat')
  async handleNewMessage(chat: Chat, sender: any) {
    console.log('New Chat', chat);
    await this.chatService.saveChat(chat);
    sender.emit('newChat', chat);
    sender.broadcast.emit('newChat', chat);
    await this.chatService.sendMessagesToOfflineUsers(chat);
  }
}
