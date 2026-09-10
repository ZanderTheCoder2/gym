import { TabList, TabListProps, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Image, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
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
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton accessibilityLabel="Explore" icon={require('@/assets/images/tabIcons/explore.png')} />
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
  tabList: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'transparent', elevation: 20, flexDirection: 'row', gap: 12, height: 44, justifyContent: 'center', position: 'absolute', width: 100, zIndex: 20 },
  tabButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  pressed: { opacity: 0.7 },
  icon: { height: 21, opacity: 0.55, width: 21 },
  iconFocused: { opacity: 1 },
});
