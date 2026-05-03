/**
 * VoiceWaveform — Animated orb/waveform for voice state
 * Shows different animations based on voice state
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';
import { VoiceState } from '../../store/voiceStore';

const { width } = Dimensions.get('window');
const ORB_SIZE = width * 0.55;

interface VoiceWaveformProps {
  state: VoiceState;
}

export function VoiceWaveform({ state }: VoiceWaveformProps) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const orbScale = useRef(new Animated.Value(1)).current;
  const orbOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (state === 'listening') {
      // Ripple rings animation
      const ripple = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );

      ripple(ring1, 0).start();
      ripple(ring2, 400).start();
      ripple(ring3, 800).start();

      // Orb pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(orbScale, { toValue: 0.97, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else if (state === 'processing') {
      ring1.stopAnimation();
      ring2.stopAnimation();
      ring3.stopAnimation();

      // Slow rotation-like pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbOpacity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
          Animated.timing(orbOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else if (state === 'speaking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, { toValue: 1.08, duration: 300, useNativeDriver: true }),
          Animated.timing(orbScale, { toValue: 0.95, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      // Idle — gentle float
      ring1.stopAnimation();
      ring2.stopAnimation();
      ring3.stopAnimation();
      orbScale.stopAnimation();
      orbOpacity.stopAnimation();

      Animated.parallel([
        Animated.timing(orbScale, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(orbOpacity, { toValue: 0.8, duration: 300, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
          Animated.timing(orbScale, { toValue: 0.98, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [state]);

  const getRingStyle = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.2],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.3, 0],
    }),
  });

  const orbColor = state === 'listening'
    ? Colors.micActive
    : state === 'speaking'
    ? Colors.secondary
    : Colors.primary;

  return (
    <View style={styles.container}>
      {/* Ripple rings */}
      {[ring1, ring2, ring3].map((ring, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ring,
            getRingStyle(ring),
            { borderColor: orbColor },
          ]}
        />
      ))}

      {/* Main orb */}
      <Animated.View
        style={[
          styles.orbWrapper,
          {
            transform: [{ scale: orbScale }],
            opacity: orbOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={
            state === 'listening'
              ? ['#ff4444', '#ff8888']
              : state === 'speaking'
              ? [Colors.secondary, '#a855f7']
              : [Colors.primary, Colors.secondary]
          }
          style={styles.orb}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        >
          {/* Inner glow */}
          <View style={styles.orbInner} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: ORB_SIZE * 0.7,
    height: ORB_SIZE * 0.7,
    borderRadius: ORB_SIZE * 0.35,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  orbWrapper: {
    width: ORB_SIZE * 0.65,
    height: ORB_SIZE * 0.65,
    borderRadius: ORB_SIZE * 0.325,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  orb: {
    flex: 1,
    borderRadius: ORB_SIZE * 0.325,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbInner: {
    width: '40%',
    height: '40%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
