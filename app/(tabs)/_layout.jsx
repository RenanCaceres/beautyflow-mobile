import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { C } from '../../src/theme';

function Icon({ emoji }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: C.pink,
      tabBarInactiveTintColor: C.hint,
      tabBarStyle: { borderTopColor: 'rgba(0,0,0,0.08)' },
      headerStyle: { backgroundColor: 'white' },
      headerTitleStyle: { fontWeight: '600', color: C.text },
      headerShadowVisible: false,
    }}>
      <Tabs.Screen name="index"    options={{ title: 'Agenda',   tabBarIcon: ({ color }) => <Icon emoji="📅" /> }} />
      <Tabs.Screen name="clientes" options={{ title: 'Clientes', tabBarIcon: () => <Icon emoji="👥" /> }} />
      <Tabs.Screen name="servicos" options={{ title: 'Serviços', tabBarIcon: () => <Icon emoji="✨" /> }} />
      <Tabs.Screen name="consumo"  options={{ title: 'Consumo',  tabBarIcon: () => <Icon emoji="🛍️" /> }} />
      <Tabs.Screen name="caixa"    options={{ title: 'Caixa',    tabBarIcon: () => <Icon emoji="📊" /> }} />
      <Tabs.Screen name="retorno"  options={{ title: 'Retorno',  tabBarIcon: () => <Icon emoji="🔔" /> }} />
      <Tabs.Screen name="marketing" options={{ title: 'Marketing', tabBarIcon: () => <Icon emoji="💬" /> }} />
    </Tabs>
  );
}
