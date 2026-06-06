import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import type { RootState } from '../store';
import WelcomeScreen from '../screens/Welcome';
import LoginScreen from '../screens/Login';
import RegisterScreen from '../screens/Register';
import MainTabs from './tabs';
import FiltersScreen from '../screens/Filter';
import ResultsScreen from '../screens/Result';
import DetailsScreen from '../screens/Details';
import RecommendationsScreen from '../screens/Recommendations';
import UsefulPhrasesScreen from '../screens/UsefulPhrases';
import ItineraryScreen from '../screens/Itinerary';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['frontendtapp://'],
  config: {
    screens: {
      Details: 'place/:placeId',
      UsefulPhrases: 'useful-phrases',
    },
  },
};

export default function Routes() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />

            <Stack.Screen name="Filters" component={FiltersScreen} />

            <Stack.Screen name="Results" component={ResultsScreen} />

            <Stack.Screen name="Details" component={DetailsScreen} />

            <Stack.Screen
              name="Recommendations"
              component={RecommendationsScreen}
            />

            <Stack.Screen
              name="UsefulPhrases"
              component={UsefulPhrasesScreen}
            />

            <Stack.Screen
              name="ItineraryDetails"
              component={ItineraryScreen}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />

            <Stack.Screen name="Login" component={LoginScreen} />

            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}