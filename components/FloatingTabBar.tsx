
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width - 32,
  borderRadius = 25,
  bottomMargin = 34,
}: FloatingTabBarProps) {
  const animatedIndex = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            animatedIndex.value,
            [0, tabs.length - 1],
            [0, containerWidth / tabs.length * (tabs.length - 1)]
          ),
        },
      ],
    };
  });

  const { colors: themeColors } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const handleTabPress = (route: string) => {
    const index = tabs.findIndex(tab => tab.route === route);
    if (index !== -1) {
      animatedIndex.value = withSpring(index);
    }
    router.push(route as any);
  };

  const getActiveIndex = () => {
    const activeTab = tabs.find(tab => pathname.includes(tab.name));
    return activeTab ? tabs.indexOf(activeTab) : 0;
  };

  React.useEffect(() => {
    animatedIndex.value = withSpring(getActiveIndex());
  }, [pathname]);

  return (
    <SafeAreaView style={[styles.container, { marginBottom: bottomMargin }]}>
      <BlurView
        intensity={80}
        tint="light"
        style={[
          styles.tabBar,
          {
            width: containerWidth,
            borderRadius,
          },
        ]}
      >
        {/* Active tab indicator */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              width: containerWidth / tabs.length,
              borderRadius: borderRadius - 4,
            },
            animatedStyle,
          ]}
        />

        {/* Tab buttons */}
        {tabs.map((tab, index) => {
          const isActive = pathname.includes(tab.name);
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tabButton, { width: containerWidth / tabs.length }]}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <IconSymbol
                  name={tab.icon as any}
                  size={20}
                  color={isActive ? colors.primary : colors.text}
                  style={[
                    styles.tabIcon,
                    { opacity: isActive ? 1 : 0.6 }
                  ]}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? colors.primary : colors.text,
                      opacity: isActive ? 1 : 0.6,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  activeIndicator: {
    position: 'absolute',
    height: '80%',
    backgroundColor: colors.highlight,
    margin: 4,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
});
