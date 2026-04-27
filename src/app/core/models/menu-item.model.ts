export interface AppMenuItemModel {
  label: string;
  icon?: string;
  routerLink?: string;
  items?: AppMenuItemModel[][];
  roles?: string[];
  alignRight?: boolean;
}
