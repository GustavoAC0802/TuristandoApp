import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/Home';
import ProfileScreen from '../screens/Profile';
import FavoritesScreen from '../screens/Favorite';

import HomeIcon from '../assets/images/Home.png';
import ExploreIcon from '../assets/images/UserRoutes.png';
import FavoritesIcon from '../assets/images/Favorite.png';
import ProfileIcon from '../assets/images/Profile.png';

function PlaceholderScreen() {
  return null;
}

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 72,
          paddingTop: 6,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: '#94A3B8',
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={HomeIcon}
              style={[
                styles.icon,
                {
                  tintColor: focused ? '#1E3A8A' : '#94A3B8',
                  opacity: focused ? 1 : 0.7,
                },
              ]}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tab.Screen
        name="ExploreTab"
        component={PlaceholderScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={ExploreIcon}
              style={[
                styles.icon,
                {
                  tintColor: focused ? '#1E3A8A' : '#94A3B8',
                  opacity: focused ? 1 : 0.7,
                },
              ]}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={FavoritesIcon}
              style={[
                styles.icon,
                {
                  tintColor: focused ? '#1E3A8A' : '#94A3B8',
                  opacity: focused ? 1 : 0.7,
                },
              ]}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={ProfileIcon}
              style={[
                styles.icon,
                {
                  tintColor: focused ? '#1E3A8A' : '#94A3B8',
                  opacity: focused ? 1 : 0.7,
                },
              ]}
              resizeMode="contain"
            />
          ),
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