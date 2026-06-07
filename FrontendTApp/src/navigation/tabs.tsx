import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

import type { RootState } from '../store';

import HomeScreen from '../screens/Home';
import ProfileScreen from '../screens/Profile';
import FavoritesScreen from '../screens/Favorite';
import ItineraryScreen from '../screens/Itinerary';

import HomeIcon from '../assets/images/Home.png';
import ExploreIcon from '../assets/images/UserRoutes.png';
import FavoritesIcon from '../assets/images/Favorite.png';
import ProfileIcon from '../assets/images/Profile.png';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const theme = useSelector((state: RootState) => state.theme.mode);
  const isDark = theme === 'dark';

  const tabBarBackground = isDark ? '#0F172A' : '#FFFFFF';
  const tabBarBorder = isDark ? '#334155' : '#CBD5E1';
  const activeIcon = isDark ? '#60A5FA' : '#1E3A8A';
  const inactiveIcon = isDark ? '#94A3B8' : '#64748B';

  function renderIcon(source: number, focused: boolean) {
    return (
      <Image
        source={source}
        style={[
          styles.icon,
          {
            tintColor: focused ? activeIcon : inactiveIcon,
            opacity: focused ? 1 : 0.75,
          },
        ]}
        resizeMode="contain"
      />
    );
  }

  return (
    <Tab.Navigator
      key={theme}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: activeIcon,
        tabBarInactiveTintColor: inactiveIcon,
        tabBarStyle: {
          height: 72,
          paddingTop: 6,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: tabBarBorder,
          backgroundColor: tabBarBackground,
          elevation: 12,
          shadowColor: '#000000',
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: 8,
          shadowOffset: {
            width: 0,
            height: -2,
          },
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        sceneStyle: {
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => renderIcon(HomeIcon, focused),
        }}
      />

      <Tab.Screen
        name="ItineraryTab"
        component={ItineraryScreen}
        options={{
          tabBarIcon: ({ focused }) => renderIcon(ExploreIcon, focused),
        }}
      />

      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ focused }) => renderIcon(FavoritesIcon, focused),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => renderIcon(ProfileIcon, focused),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 36,
    height: 36,
    marginBottom: 4,
  },
});