import React, {useCallback, useEffect, useRef} from 'react';
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useThemedStyles} from '../lib/ThemeContext';
import {Theme, alpha} from '../theme';

const ITEM_HEIGHT = 56;
const VISIBLE_PAD = ITEM_HEIGHT; // padding so first/last items can center

interface Props {
  value: number;
  onChange: (value: number) => void;
  max: number;
  label: string;
}

function DialPicker({value, onChange, max, label}: Props) {
  const styles = useThemedStyles(makeStyles);
  const listRef = useRef<FlatList<number>>(null);
  const data = Array.from({length: max + 1}, (_, i) => i);
  const isUserScrolling = useRef(false);
  const hasMounted = useRef(false);
  const scrollY = useRef(new Animated.Value(value * ITEM_HEIGHT)).current;

  useEffect(() => {
    if (!isUserScrolling.current) {
      listRef.current?.scrollToOffset({
        offset: value * ITEM_HEIGHT,
        animated: hasMounted.current,
      });
    }
    hasMounted.current = true;
  }, [value]);

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      isUserScrolling.current = false;
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(max, idx));
      if (clamped !== value) onChange(clamped);
    },
    [value, max, onChange],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerBox}>
        <View style={styles.highlightBand} pointerEvents="none" />
        <Animated.FlatList
          ref={listRef}
          data={data}
          keyExtractor={item => String(item)}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScrollBeginDrag={() => (isUserScrolling.current = true)}
          onMomentumScrollEnd={handleMomentumEnd}
          onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          contentContainerStyle={{paddingVertical: VISIBLE_PAD}}
          renderItem={({item}) => {
            // Distance of this row from the centre band drives its look.
            const inputRange = [
              (item - 2) * ITEM_HEIGHT,
              (item - 1) * ITEM_HEIGHT,
              item * ITEM_HEIGHT,
              (item + 1) * ITEM_HEIGHT,
              (item + 2) * ITEM_HEIGHT,
            ];
            const scale = scrollY.interpolate({
              inputRange,
              outputRange: [0.6, 0.75, 1.15, 0.75, 0.6],
              extrapolate: 'clamp',
            });
            const opacity = scrollY.interpolate({
              inputRange,
              outputRange: [0.15, 0.45, 1, 0.45, 0.15],
              extrapolate: 'clamp',
            });
            const rotateX = scrollY.interpolate({
              inputRange,
              outputRange: ['60deg', '35deg', '0deg', '-35deg', '-60deg'],
              extrapolate: 'clamp',
            });
            const isActive = item === value;
            return (
              <Animated.View
                style={[
                  styles.item,
                  {opacity, transform: [{perspective: 400}, {rotateX}, {scale}]},
                ]}>
                <Text style={[styles.itemText, isActive ? styles.itemTextActive : styles.itemTextInactive]}>
                  {String(item).padStart(2, '0')}
                </Text>
              </Animated.View>
            );
          }}
        />
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) => {
  const c = t.colors;
  return StyleSheet.create({
    wrap: {alignItems: 'center'},
    label: {
      color: c.textLo,
      fontSize: 9,
      letterSpacing: 3,
      marginBottom: 8,
    },
    pickerBox: {
      width: 96,
      height: 168,
      overflow: 'hidden',
    },
    highlightBand: {
      position: 'absolute',
      top: 56,
      left: 0,
      right: 0,
      height: ITEM_HEIGHT,
      backgroundColor: alpha(c.accent, 0.12),
      borderWidth: 1,
      borderColor: alpha(c.accent, 0.35),
      borderRadius: 8,
      zIndex: 1,
    },
    item: {
      height: ITEM_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemText: {
      fontWeight: '200',
      fontVariant: ['tabular-nums'],
      fontSize: 30,
    },
    itemTextActive: {color: c.accent},
    itemTextInactive: {color: c.textLo},
  });
};

// Memoised: the pager re-renders on page change; the wheels needn't.
export default React.memo(DialPicker);
