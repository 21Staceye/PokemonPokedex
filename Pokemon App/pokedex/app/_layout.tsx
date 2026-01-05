import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack>
    <Stack.Screen 
    name="index" 
    options={{
      title: "Pokedex",
    headerTitleAlign:'center',
    headerStyle:{
      backgroundColor:'#4f4b4bff',
    },
    headerTintColor: '#fff',
    headerTitleStyle:{
      fontWeight: 'bold',
      fontSize: 22,
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
