import React, {useCallback, useEffect, useRef} from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {colors} from '../theme';

const ITEM_HEIGHT = 56;
const VISIBLE_PAD = ITEM_HEIGHT; // padding so first/last items can center

interface Props {
  value: number;
  onChange: (value: number) => void;
  max: number;
  label: string;
}

export default function DialPicker({value, onChange, max, label}: Props) {
  const listRef = useRef<FlatList<number>>(null);
  const data = Array.from({length: max + 1}, (_, i) => i);
  const isUserScrolling = useRef(false);
  const hasMounted = useRef(false);

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
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={item => String(item)}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScrollBeginDrag={() => (isUserScrolling.current = true)}
          onMomentumScrollEnd={handleMomentumEnd}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          contentContainerStyle={{paddingVertical: VISIBLE_PAD}}
          renderItem={({item}) => {
            const isActive = item === value;
            return (
              <View style={styles.item}>
                <Text
                  style={[
                    styles.itemText,
                    isActive ? styles.itemTextActive : styles.itemTextInactive,
                  ]}>
                  {String(item).padStart(2, '0')}
                </Text>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center'},
  label: {
    color: colors.textLo,
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
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
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
  },
  itemTextActive: {
    color: colors.amber,
    fontSize: 32,
  },
  itemTextInactive: {
    color: colors.textLo,
    fontSize: 24,
    opacity: 0.6,
  },
});
