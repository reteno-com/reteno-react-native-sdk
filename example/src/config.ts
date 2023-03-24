export enum ScreenNames {
  home = 'Home',
  attributes = 'Attributes',
  events = 'Events',
}

export type RootStackParamList = {
  [ScreenNames.home]: undefined;
  [ScreenNames.attributes]: undefined;
  [ScreenNames.events]: undefined;
};
