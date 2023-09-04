export enum ScreenNames {
  home = 'Home',
  attributes = 'Attributes',
  events = 'Events',
  anonymousUserAttributes = 'AnonymousUserAttributes',
}

export type RootStackParamList = {
  [ScreenNames.home]: undefined;
  [ScreenNames.attributes]: undefined;
  [ScreenNames.events]: undefined;
  [ScreenNames.anonymousUserAttributes]: undefined;
};
