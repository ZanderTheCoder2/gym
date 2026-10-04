import { TabList, TabListProps, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function AppTabs() {
  return (
    <View style={styles.root}>
      <Tabs>
      <View style={styles.tabSlot}>
        <TabSlot style={styles.tabSlotContent} />
      </View>
      <TabList asChild>
        <WebTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton accessibilityLabel="Home" label="Home" icon={require('@/assets/images/tabIcons/home.png')} />
          </TabTrigger>
          <TabTrigger name="workouts" href="/workouts" asChild>
            <TabButton accessibilityLabel="Workouts" label="Train" icon={require('@/assets/images/tabIcons/explore.png')} />
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton accessibilityLabel="Programs" label="Programs" icon={require('@/assets/images/tabIcons/home.png')} />
          </TabTrigger>
          <TabTrigger name="more" href="/more" asChild>
            <MoreButton accessibilityLabel="More" />
          </TabTrigger>
        </WebTabList>
      </TabList>
      </Tabs>
    </View>
  );
}

function TabButton({ icon, label, isFocused, ...props }: TabTriggerSlotProps & { icon: number; label: string }) {
  return <Pressable {...props} accessibilityRole="button" style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}><Image source={icon} tintColor={isFocused ? '#E3B967' : '#F4F2EA'} style={[styles.icon, isFocused && styles.iconFocused]} /><Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>{label}</Text></Pressable>;
}

function MoreButton({ isFocused, ...props }: TabTriggerSlotProps) {
  return <Pressable {...props} accessibilityRole="button" style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}><Text style={[styles.moreText, isFocused && styles.moreTextFocused]}>•••</Text><Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>More</Text></Pressable>;
}

function WebTabList(props: TabListProps) {
  return <View {...props} style={styles.tabList}>{props.children}</View>;
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#111411', flex: 1 },
  tabSlot: { flex: 1, minHeight: 0 },
  tabSlotContent: { backgroundColor: '#111411', flex: 1 },
  tabList: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#1A1F1B', borderColor: '#343C35', borderRadius: 20, borderWidth: 1, boxShadow: '0px 4px 14px rgba(0, 0, 0, 0.2)', flexDirection: 'row', gap: 3, height: 66, justifyContent: 'center', marginBottom: 18, maxWidth: 380, paddingHorizontal: 7, width: '92%', zIndex: 20 },
  tabButton: { alignItems: 'center', flex: 1, height: 56, justifyContent: 'center', minWidth: 0 },
  pressed: { opacity: 0.7 },
  icon: { height: 20, opacity: 0.55, width: 20 },
  iconFocused: { opacity: 1 },
  tabLabel: { color: '#A7AFA5', fontSize: 9, fontWeight: '800', marginTop: 3 },
  tabLabelFocused: { color: '#E3B967' },
  moreText: { color: '#F4F2EA', fontSize: 16, fontWeight: '900', letterSpacing: 2, opacity: 0.55 },
  moreTextFocused: { color: '#E3B967', opacity: 1 },
});
