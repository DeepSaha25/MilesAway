import {NavigatorScreenParams} from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Leaderboards: undefined;
  History: undefined;
  Community: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { resetToken?: string } | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  RunTracking: undefined;
  RunSummary: undefined;
};
