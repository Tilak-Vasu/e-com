# api/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import ChatThread, ChatMessage

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.room_group_name = f'chat_{self.thread_id}'
        self.user = self.scope['user']

        is_participant = await self.is_user_in_thread(self.user, self.thread_id)
        if not is_participant:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive a message from the WebSocket (frontend)
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_text = text_data_json['message']

        message = await self.save_message(self.user, self.thread_id, message_text)

        # Broadcast the message to everyone in the room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_text,
                'username': self.user.username,
                'timestamp': str(message.timestamp),
                'is_staff': self.user.is_staff  # <<< CHANGE #1: Add staff status to the message
            }
        )

    # Receive a message from the room group and send it down to the WebSocket (frontend)
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'username': event['username'],
            'timestamp': event['timestamp'],
            # <<< CHANGE #2: Pass the staff status along to the client
            'is_staff': event.get('is_staff', False) 
        }))

    # --- Helper methods to interact with the Django ORM asynchronously ---
    @sync_to_async
    def is_user_in_thread(self, user, thread_id):
        if not user.is_authenticated:
            return False
        return ChatThread.objects.filter(id=thread_id, participants=user).exists()

    @sync_to_async
    def save_message(self, user, thread_id, text):
        thread = ChatThread.objects.get(id=thread_id)
        thread.save(update_fields=['updated_at']) 
        return ChatMessage.objects.create(thread=thread, sender=user, text=text)