import { Component, signal, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';

type GameState = 'lobby' | 'waiting' | 'picking' | 'waiting-result' | 'result';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {
  private socket: Socket;

  emojis = signal<string[]>([]);
  gameState = signal<GameState>('lobby');
  roomCode = signal('');
  joinCodeInput = signal('');
  myChoice = signal<string | null>(null);
  opponentChoice = signal<string | null>(null);
  isMatch = signal(false);
  streak = signal(0);
  opponentHasPicked = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.socket = io(environment.socketUrl);

    this.socket.on('room-created', ({ roomCode }: { roomCode: string }) => {
      this.roomCode.set(roomCode);
      this.gameState.set('waiting');
    });

    this.socket.on('room-joined', ({ roomCode }: { roomCode: string }) => {
      this.roomCode.set(roomCode);
    });

    this.socket.on('game-ready', ({ emojis }: { emojis: string[] }) => {
      this.emojis.set(emojis);
      this.myChoice.set(null);
      this.opponentHasPicked.set(false);
      this.gameState.set('picking');
    });

    this.socket.on('room-error', ({ message }: { message: string }) => {
      this.error.set(message);
    });

    this.socket.on('opponent-picked', () => {
      this.opponentHasPicked.set(true);
    });

    this.socket.on('game-result', ({ myChoice, opponentChoice, match, streak }: {
      myChoice: string; opponentChoice: string; match: boolean; streak: number;
    }) => {
      this.myChoice.set(myChoice);
      this.opponentChoice.set(opponentChoice);
      this.isMatch.set(match);
      this.streak.set(streak);
      this.gameState.set('result');
    });

    this.socket.on('game-reset', ({ emojis }: { emojis: string[] }) => {
      this.emojis.set(emojis);
      this.myChoice.set(null);
      this.opponentChoice.set(null);
      this.isMatch.set(false);
      this.opponentHasPicked.set(false);
      this.gameState.set('picking');
    });

    this.socket.on('opponent-left', () => {
      this.error.set('Your opponent disconnected.');
      this.gameState.set('lobby');
      this.roomCode.set('');
      this.myChoice.set(null);
    });
  }

  createRoom() {
    this.error.set(null);
    this.socket.emit('create-room');
  }

  joinRoom() {
    this.error.set(null);
    if (!this.joinCodeInput()) return;
    this.socket.emit('join-room', { roomCode: this.joinCodeInput().toUpperCase() });
  }

  pickEmoji(emoji: string) {
    this.myChoice.set(emoji);
    this.socket.emit('pick-emoji', { roomCode: this.roomCode(), emoji });
    this.gameState.set('waiting-result');
  }

  playAgain() {
    this.socket.emit('play-again', { roomCode: this.roomCode() });
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }
}
