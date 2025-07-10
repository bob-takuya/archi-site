/**
 * Mobile-specific type definitions for TypeScript
 */

// Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';
  readonly message: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechGrammarList {
  readonly length: number;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

// Extend Window interface
declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

// Vibration API
interface Navigator {
  vibrate(pattern: number | number[]): boolean;
}

// Network Information API
interface NetworkInformation extends EventTarget {
  readonly downlink: number;
  readonly downlinkMax: number;
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
  onchange: ((this: NetworkInformation, ev: Event) => any) | null;
}

interface Navigator {
  readonly connection?: NetworkInformation;
  readonly mozConnection?: NetworkInformation;
  readonly webkitConnection?: NetworkInformation;
}

// Web Share API
interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface Navigator {
  share?(data?: ShareData): Promise<void>;
  canShare?(data?: ShareData): boolean;
}

// Device Motion API
interface DeviceMotionEvent extends Event {
  readonly acceleration: DeviceAcceleration | null;
  readonly accelerationIncludingGravity: DeviceAcceleration | null;
  readonly interval: number;
  readonly rotationRate: DeviceRotationRate | null;
}

interface DeviceAcceleration {
  readonly x: number | null;
  readonly y: number | null;
  readonly z: number | null;
}

interface DeviceRotationRate {
  readonly alpha: number | null;
  readonly beta: number | null;
  readonly gamma: number | null;
}

// Device Orientation API
interface DeviceOrientationEvent extends Event {
  readonly alpha: number | null;
  readonly beta: number | null;
  readonly gamma: number | null;
  readonly absolute: boolean;
}

// Screen Orientation API
interface ScreenOrientation extends EventTarget {
  readonly angle: number;
  readonly type: OrientationType;
  lock(orientation: OrientationLockType): Promise<void>;
  unlock(): void;
  onchange: ((this: ScreenOrientation, ev: Event) => any) | null;
}

type OrientationType = 
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

type OrientationLockType =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

interface Screen {
  readonly orientation?: ScreenOrientation;
}

// Touch events
interface TouchEvent extends UIEvent {
  readonly altKey: boolean;
  readonly changedTouches: TouchList;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly targetTouches: TouchList;
  readonly touches: TouchList;
}

interface Touch {
  readonly clientX: number;
  readonly clientY: number;
  readonly force: number;
  readonly identifier: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly rotationAngle: number;
  readonly screenX: number;
  readonly screenY: number;
  readonly target: EventTarget;
}

interface TouchList {
  readonly length: number;
  item(index: number): Touch | null;
  [index: number]: Touch;
}

// Web App Manifest
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}

// Mobile-specific performance metrics
interface PerformanceNavigationTiming extends PerformanceEntry {
  readonly unloadEventStart: number;
  readonly unloadEventEnd: number;
  readonly domInteractive: number;
  readonly domContentLoadedEventStart: number;
  readonly domContentLoadedEventEnd: number;
  readonly domComplete: number;
  readonly loadEventStart: number;
  readonly loadEventEnd: number;
  readonly type: NavigationType;
  readonly redirectCount: number;
  readonly fetchStart: number;
  readonly domainLookupStart: number;
  readonly domainLookupEnd: number;
  readonly connectStart: number;
  readonly connectEnd: number;
  readonly secureConnectionStart: number;
  readonly requestStart: number;
  readonly responseStart: number;
  readonly responseEnd: number;
}

// Service Worker types
interface ServiceWorkerContainer {
  readonly controller: ServiceWorker | null;
  readonly ready: Promise<ServiceWorkerRegistration>;
  getRegistration(clientURL?: string): Promise<ServiceWorkerRegistration | undefined>;
  getRegistrations(): Promise<ReadonlyArray<ServiceWorkerRegistration>>;
  register(scriptURL: string, options?: RegistrationOptions): Promise<ServiceWorkerRegistration>;
  startMessages(): void;
  addEventListener<K extends keyof ServiceWorkerContainerEventMap>(
    type: K,
    listener: (this: ServiceWorkerContainer, ev: ServiceWorkerContainerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
}

interface ServiceWorkerContainerEventMap {
  controllerchange: Event;
  message: MessageEvent;
  messageerror: MessageEvent;
}

// Background Sync
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}

interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
  readonly lastChance: boolean;
}

interface ServiceWorkerGlobalScopeEventMap {
  sync: SyncEvent;
}

export {};