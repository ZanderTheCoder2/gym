import { TabList, TabListProps, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <WebTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton accessibilityLabel="Home" icon={require('@/assets/images/tabIcons/home.png')} />
          </TabTrigger>
          <TabTrigger name="workouts" href="/workouts" asChild>
            <TabButton accessibilityLabel="Workouts" icon={require('@/assets/images/tabIcons/explore.png')} />
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton accessibilityLabel="Programs" icon={require('@/assets/images/tabIcons/home.png')} />
          </TabTrigger>
          <TabTrigger name="more" href="/more" asChild>
            <MoreButton accessibilityLabel="More" />
          </TabTrigger>
        </WebTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ icon, isFocused, ...props }: TabTriggerSlotProps & { icon: number }) {
  return <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}><Image source={icon} style={[styles.icon, isFocused && styles.iconFocused]} /></Pressable>;
}

function MoreButton({ isFocused, ...props }: TabTriggerSlotProps) {
  return <Pressable {...props} accessibilityRole="button" style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}><Text style={[styles.moreText, isFocused && styles.iconFocused]}>•••</Text></Pressable>;
}

function WebTabList(props: TabListProps) {
  return <View {...props} style={styles.tabList}>{props.children}</View>;
}

const styles = StyleSheet.create({
  tabSlot: { backgroundColor: '#0B0B0B', flex: 1 },
  tabList: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 28, borderWidth: 1, bottom: 18, flexDirection: 'row', gap: 8, height: 52, justifyContent: 'center', paddingHorizontal: 4, position: 'absolute', shadowColor: '#000000', shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.12, shadowRadius: 12, width: 204, zIndex: 20 },
  tabButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  pressed: { opacity: 0.7 },
  icon: { height: 21, opacity: 0.55, tintColor: '#FFFFFF', width: 21 },
  iconFocused: { opacity: 1, tintColor: '#D4AF37' },
  moreText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 2, opacity: 0.55 },
});
