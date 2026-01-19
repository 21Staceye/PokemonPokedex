import { Stack } from "expo-router";
export default function RootLayout() {
  return <Stack>
    <Stack.Screen 
    name="index" 
  options={{
    title: "Pokédex",
    headerTitleAlign: 'center',
    headerStyle: {
      backgroundColor: '#DC0A2D',
    },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: {
      fontWeight: '700',
      fontSize: 24,
     
    },
  }}
      
      />
       <Stack.Screen 
    name="details" 
    options={{
      title: "Details",
      headerBackButtonDisplayMode:"minimal",
      presentation: "formSheet",
      sheetAllowedDetents: [0.3,0.5,0.7],
      sheetGrabberVisible: true,
      }}/>
  </Stack>;
}
