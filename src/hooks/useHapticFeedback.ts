/**
 * useHapticFeedback - Custom hook for haptic feedback on supported devices
 * Provides tactile feedback for user interactions to enhance mobile experience
 */

import { useCallback, useRef } from 'react';

export type HapticType = 
  | 'selection' 
  | 'impact' 
  | 'notification' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'light'
  | 'medium'
  | 'heavy';

export interface HapticOptions {
  intensity?: number; // 0-1 for intensity (if supported)
  duration?: number;  // Duration in ms (if supported)
  fallback?: boolean; // Whether to use audio/visual fallback
}

interface HapticCapabilities {
  isSupported: boolean;
  hasVibrationAPI: boolean;
  hasHapticFeedback: boolean;
  hasGamepadVibration: boolean;
  supportsIntensity: boolean;
  supportsDuration: boolean;
}

export const useHapticFeedback = () => {
  const lastFeedbackTime = useRef<number>(0);
  const feedbackCooldown = 50; // Minimum time between feedback events (ms)
  
  // Detect haptic capabilities
  const capabilities: HapticCapabilities = {
    isSupported: typeof navigator !== 'undefined' && (
      'vibrate' in navigator || 
      'hapticFeedback' in navigator ||
      'getGamepads' in navigator
    ),
    hasVibrationAPI: typeof navigator !== 'undefined' && 'vibrate' in navigator,
    hasHapticFeedback: typeof navigator !== 'undefined' && 'hapticFeedback' in navigator,
    hasGamepadVibration: typeof navigator !== 'undefined' && 'getGamepads' in navigator,
    supportsIntensity: false, // Will be detected at runtime
    supportsDuration: typeof navigator !== 'undefined' && 'vibrate' in navigator
  };
  
  // Check for Web Vibration API patterns support
  const checkVibratePatternSupport = useCallback((): boolean => {
    if (!capabilities.hasVibrationAPI) return false;
    
    try {
      // Test if vibrate accepts patterns
      const result = navigator.vibrate([1]);
      return result !== false;
    } catch {
      return false;
    }
  }, [capabilities.hasVibrationAPI]);
  
  // Get vibration pattern for haptic type
  const getVibrationPattern = useCallback((type: HapticType): number | number[] => {
    switch (type) {
      case 'selection':
      case 'light':
        return 10;
      
      case 'impact':
      case 'medium':
        return 25;
      
      case 'heavy':
        return 50;
      
      case 'notification':
        return [50, 50, 50];
      
      case 'success':
        return [25, 25, 25, 25, 25];
      
      case 'warning':
        return [100, 50, 100];
      
      case 'error':
        return [200, 100, 200, 100, 200];
      
      default:
        return 25;
    }
  }, []);
  
  // Native iOS haptic feedback (if available)
  const triggerIOSHaptic = useCallback((type: HapticType): boolean => {
    // @ts-ignore - iOS specific API
    if (typeof window !== 'undefined' && window.TapticEngine) {
      try {
        switch (type) {
          case 'selection':
            // @ts-ignore
            window.TapticEngine.selection();
            return true;
          
          case 'impact':
          case 'light':
            // @ts-ignore
            window.TapticEngine.impact({ style: 'light' });
            return true;
          
          case 'medium':
            // @ts-ignore
            window.TapticEngine.impact({ style: 'medium' });
            return true;
          
          case 'heavy':
            // @ts-ignore
            window.TapticEngine.impact({ style: 'heavy' });
            return true;
          
          case 'notification':
          case 'success':
            // @ts-ignore
            window.TapticEngine.notification({ type: 'success' });
            return true;
          
          case 'warning':
            // @ts-ignore
            window.TapticEngine.notification({ type: 'warning' });
            return true;
          
          case 'error':
            // @ts-ignore
            window.TapticEngine.notification({ type: 'error' });
            return true;
        }
      } catch (error) {
        console.debug('iOS Haptic feedback failed:', error);
      }
    }
    return false;
  }, []);
  
  // Android haptic feedback (if available)
  const triggerAndroidHaptic = useCallback((type: HapticType): boolean => {
    // @ts-ignore - Android specific API
    if (typeof window !== 'undefined' && window.AndroidInterface?.hapticFeedback) {
      try {
        const androidType = type === 'selection' ? 'VIRTUAL_KEY' : 
                           type === 'impact' ? 'LONG_PRESS' :
                           type === 'success' ? 'CONTEXT_CLICK' : 'VIRTUAL_KEY';
        
        // @ts-ignore
        window.AndroidInterface.hapticFeedback(androidType);
        return true;
      } catch (error) {
        console.debug('Android Haptic feedback failed:', error);
      }
    }
    return false;
  }, []);
  
  // Gamepad vibration for controllers
  const triggerGamepadVibration = useCallback((
    type: HapticType, 
    options: HapticOptions
  ): boolean => {
    if (!capabilities.hasGamepadVibration) return false;
    
    try {
      const gamepads = navigator.getGamepads();
      
      for (const gamepad of gamepads) {
        if (gamepad && gamepad.vibrationActuator) {
          const intensity = options.intensity || 0.5;
          const duration = options.duration || 100;
          
          let weakMagnitude = 0;
          let strongMagnitude = 0;
          
          switch (type) {
            case 'light':
            case 'selection':
              weakMagnitude = intensity * 0.3;
              break;
            
            case 'medium':
            case 'impact':
              strongMagnitude = intensity * 0.5;
              break;
            
            case 'heavy':
            case 'error':
              strongMagnitude = intensity * 0.8;
              break;
            
            case 'success':
              weakMagnitude = intensity * 0.4;
              strongMagnitude = intensity * 0.2;
              break;
          }
          
          gamepad.vibrationActuator.playEffect('dual-rumble', {
            duration,
            weakMagnitude,
            strongMagnitude
          });
          
          return true;
        }
      }
    } catch (error) {
      console.debug('Gamepad vibration failed:', error);
    }
    
    return false;
  }, [capabilities.hasGamepadVibration]);
  
  // Fallback vibration using Web Vibration API
  const triggerWebVibration = useCallback((type: HapticType): boolean => {
    if (!capabilities.hasVibrationAPI) return false;
    
    try {
      const pattern = getVibrationPattern(type);
      const result = navigator.vibrate(pattern);
      return result !== false;
    } catch (error) {
      console.debug('Web vibration failed:', error);
      return false;
    }
  }, [capabilities.hasVibrationAPI, getVibrationPattern]);
  
  // Audio fallback for haptic feedback
  const triggerAudioFallback = useCallback((type: HapticType): boolean => {
    try {
      // Create a very short, low-volume sound as haptic substitute
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure based on haptic type
      let frequency = 200;
      let duration = 0.05;
      let volume = 0.1;
      
      switch (type) {
        case 'selection':
        case 'light':
          frequency = 400;
          duration = 0.02;
          volume = 0.05;
          break;
        
        case 'impact':
        case 'medium':
          frequency = 300;
          duration = 0.05;
          volume = 0.08;
          break;
        
        case 'heavy':
        case 'error':
          frequency = 150;
          duration = 0.1;
          volume = 0.1;
          break;
        
        case 'success':
          frequency = 500;
          duration = 0.08;
          volume = 0.06;
          break;
      }
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      return true;
    } catch (error) {
      console.debug('Audio fallback failed:', error);
      return false;
    }
  }, []);
  
  // Visual fallback for haptic feedback
  const triggerVisualFallback = useCallback((type: HapticType): boolean => {
    try {
      // Create a subtle visual flash effect
      const flashElement = document.createElement('div');
      flashElement.style.position = 'fixed';
      flashElement.style.top = '0';
      flashElement.style.left = '0';
      flashElement.style.width = '100%';
      flashElement.style.height = '100%';
      flashElement.style.pointerEvents = 'none';
      flashElement.style.zIndex = '9999';
      flashElement.style.transition = 'opacity 0.1s ease-out';
      
      // Set color based on haptic type
      let backgroundColor = 'rgba(255, 255, 255, 0.1)';
      
      switch (type) {
        case 'success':
          backgroundColor = 'rgba(76, 175, 80, 0.1)';
          break;
        case 'warning':
          backgroundColor = 'rgba(255, 193, 7, 0.1)';
          break;
        case 'error':
          backgroundColor = 'rgba(244, 67, 54, 0.1)';
          break;
      }
      
      flashElement.style.backgroundColor = backgroundColor;
      document.body.appendChild(flashElement);
      
      // Animate the flash
      requestAnimationFrame(() => {
        flashElement.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(flashElement);
        }, 100);
      });
      
      return true;
    } catch (error) {
      console.debug('Visual fallback failed:', error);
      return false;
    }
  }, []);
  
  // Main haptic feedback function
  const triggerHapticFeedback = useCallback((
    type: HapticType,
    options: HapticOptions = {}
  ): boolean => {
    // Prevent feedback spam
    const now = Date.now();
    if (now - lastFeedbackTime.current < feedbackCooldown) {
      return false;
    }
    lastFeedbackTime.current = now;
    
    const { fallback = true } = options;
    
    // Try platform-specific haptics first
    if (triggerIOSHaptic(type)) return true;
    if (triggerAndroidHaptic(type)) return true;
    if (triggerGamepadVibration(type, options)) return true;
    if (triggerWebVibration(type)) return true;
    
    // Use fallbacks if enabled
    if (fallback) {
      // Prefer audio fallback for subtle feedback
      if (type === 'selection' || type === 'light') {
        return triggerAudioFallback(type);
      }
      
      // Use visual fallback for notification types
      if (type === 'success' || type === 'warning' || type === 'error') {
        return triggerVisualFallback(type);
      }
      
      // Try audio for other types
      return triggerAudioFallback(type);
    }
    
    return false;
  }, [
    triggerIOSHaptic,
    triggerAndroidHaptic,
    triggerGamepadVibration,
    triggerWebVibration,
    triggerAudioFallback,
    triggerVisualFallback
  ]);
  
  // Convenience methods for common patterns
  const triggerSelectionFeedback = useCallback(() => {
    return triggerHapticFeedback('selection');
  }, [triggerHapticFeedback]);
  
  const triggerImpactFeedback = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    return triggerHapticFeedback(intensity);
  }, [triggerHapticFeedback]);
  
  const triggerNotificationFeedback = useCallback((type: 'success' | 'warning' | 'error' = 'success') => {
    return triggerHapticFeedback(type);
  }, [triggerHapticFeedback]);
  
  // Test haptic feedback capability
  const testHapticSupport = useCallback(async (): Promise<HapticCapabilities> => {
    const testCapabilities = { ...capabilities };
    
    // Test pattern support
    if (capabilities.hasVibrationAPI) {
      testCapabilities.supportsDuration = checkVibratePatternSupport();
    }
    
    // Test gamepad vibration
    if (capabilities.hasGamepadVibration) {
      try {
        const gamepads = navigator.getGamepads();
        testCapabilities.hasGamepadVibration = Array.from(gamepads).some(
          gamepad => gamepad?.vibrationActuator
        );
      } catch {
        testCapabilities.hasGamepadVibration = false;
      }
    }
    
    return testCapabilities;
  }, [capabilities, checkVibratePatternSupport]);
  
  return {
    triggerHapticFeedback,
    triggerSelectionFeedback,
    triggerImpactFeedback,
    triggerNotificationFeedback,
    testHapticSupport,
    capabilities,
    isSupported: capabilities.isSupported
  };
};

export default useHapticFeedback;