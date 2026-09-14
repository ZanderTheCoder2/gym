import { TabList, TabListProps, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Image, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <CompactTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton accessibilityLabel="Home" icon={require('@/assets/images/tabIcons/home.png')} />
          </TabTrigger>
          <TabTrigger name="workouts" href="/workouts" asChild>
            <TabButton accessibilityLabel="Workouts" icon={require('@/assets/images/tabIcons/explore.png')} />
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton accessibilityLabel="Progress" icon={require('@/assets/images/tabIcons/home.png')} />
          </TabTrigger>
          <TabTrigger name="more" href="/more" asChild>
            <MoreButton accessibilityLabel="More" />
          </TabTrigger>
        </CompactTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ icon, isFocused, ...props }: TabTriggerSlotProps & { icon: number }) {
  const scheme = useColorScheme();

  return <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
    <Image
      source={icon}
      style={[styles.icon, { tintColor: scheme === 'dark' ? '#FFFFFF' : '#1C2A22' }, isFocused && styles.iconFocused]}
    />
  </Pressable>;
}

function MoreButton({ isFocused, ...props }: TabTriggerSlotProps) {
  return <Pressable {...props} accessibilityRole="button" style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}><Text style={[styles.moreText, isFocused && styles.moreTextFocused]}>•••</Text></Pressable>;
}

function CompactTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();

  return (
    <View {...props} style={[styles.tabList, { bottom: Math.max(insets.bottom, 8) }]}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  tabSlot: { backgroundColor: '#F7F3EC', flex: 1, paddingBottom: 0 },
  tabList: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'transparent', elevation: 20, flexDirection: 'row', gap: 8, height: 44, justifyContent: 'center', position: 'absolute', width: 180, zIndex: 20 },
  tabButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  pressed: { opacity: 0.7 },
  icon: { height: 21, opacity: 0.55, width: 21 },
  iconFocused: { opacity: 1 },
  moreButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  moreText: { color: '#1C2A22', fontSize: 20, fontWeight: '900', letterSpacing: 2, opacity: 0.55 },
  moreTextFocused: { opacity: 1 },
});
