import { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
interface Pokemon{
name: string;
image: string;
}
export default function Index() {
  const [pokemon, setPokes] = useState<Pokemon[]>([]);
  useEffect(() => {
    fetchPoke()

  }, [] );
  async function fetchPoke() {
    try {
      const response = await fetch("https://pokeapi.co/api/v2/pokemon/?limit=120");
      const data = await response.json();
     
      const detailedPokemons = await Promise.all(
        data.results.map(async (pokemon: any) => {
          const res = await fetch(pokemon.url);
          const details = await res.json();
          return{
            name: pokemon.name,
            image: details.sprites.front_default,
          };
        })
      );
      setPokes(detailedPokemons);
      
    } catch (error) {
      console.log(error);
    }
  } 
  return (
    <ScrollView>
      {pokemon.map((pokemo) => (
        <View key={pokemo.name}>
          <Text>{pokemo.name}</Text>
          <Image
          source={{uri: pokemo.image}}
          style={{width: 50, height: 50}}
          />
        </View>
      ))}
    </ScrollView>
  );
}