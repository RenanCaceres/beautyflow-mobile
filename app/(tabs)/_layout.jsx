import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { C } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.pink,
        tabBarInactiveTintColor: C.hint,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: C.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: 'white' },
        headerTitleStyle: { fontWeight: '600', color: C.text, fontSize: 18 },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => <Feather name="calendar" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="retorno"
        options={{
          title: 'Retorno',
          tabBarIcon: ({ color }) => <Feather name="clock" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="marketing"
        options={{
          title: 'Marketing',
          tabBarIcon: ({ color }) => <Feather name="message-circle" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="caixa"
        options={{
          title: 'Vendas',
          tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Cadastros',
          tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} />,
        }}
      />
      {/* Telas unificadas em Vendas e Cadastros (ocultas da barra inferior para manter 5 abas clean) */}
      <Tabs.Screen name="servicos" options={{ href: null }} />
      <Tabs.Screen name="consumo"  options={{ href: null }} />
    </Tabs>
  );
}
