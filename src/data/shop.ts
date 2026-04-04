import type { ShopItem } from '../models/types';

export const defaultShopItems: ShopItem[] = [
  {
    id: 'reward-massage',
    name: 'Massage',
    description: '30 Minuten Me-Time, Rücken oder Schultern',
    cost: 30,
    icon: '💆',
    theme: 'pink',
    featured: true,
  },
  {
    id: 'reward-breakfast',
    name: 'Frühstück im Bett',
    description: 'Ein entspannter Morgen ohne To-dos',
    cost: 20,
    icon: '🥐',
    theme: 'yellow',
  },
  {
    id: 'reward-date-night',
    name: 'Date Night',
    description: 'Abend zu zweit mit freier Auswahl',
    cost: 45,
    icon: '✨',
    theme: 'purple',
    featured: true,
  },
  {
    id: 'reward-gaming',
    name: 'Freie Gaming-Zeit',
    description: 'Ungestörte Quality-Time ohne Unterbrechung',
    cost: 25,
    icon: '🎮',
    theme: 'blue',
  },
];
