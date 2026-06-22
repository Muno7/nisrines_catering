import {
  HomeIcon,
  MenuIcon,
  CateringIcon,
  SubscriptionIcon,
  FavoriteIcon,
  BasketIcon,
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  WhatsappIcon,
} from './icons.jsx'

export const navLinks = [
  { id: 'home', to: '/', label: 'Home', Icon: HomeIcon },
  { id: 'menu', to: '/menu', label: 'Menu', Icon: MenuIcon },
  { id: 'catering', to: '/catering', label: 'Catering', Icon: CateringIcon },
  { id: 'subscription', to: '/subscription', label: 'Subscriptions', Icon: SubscriptionIcon },
  { id: 'favorite', to: '/favorite', label: 'Favorites', Icon: FavoriteIcon },
  { id: 'order', to: '/order', label: 'Order Basket', Icon: BasketIcon },
]

export const socialLinks = [
  { id: 'facebook', href: 'https://www.facebook.com/Nisrine.kitchen/', Icon: FacebookIcon },
  { id: 'instagram', href: 'https://www.instagram.com/nisrine_catering/', Icon: InstagramIcon },
  { id: 'tiktok', href: 'https://www.tiktok.com/@nisrine_catering', Icon: TiktokIcon },
  { id: 'whatsapp', href: 'https://api.whatsapp.com/send/?phone=96171226934&text&type=phone_number&app_absent=0', Icon: WhatsappIcon },
]
