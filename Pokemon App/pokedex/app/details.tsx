import { useLocalSearchParams } from "expo-router/build/hooks";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";

interface PokemonDetails {
  name: string;
  sprites: {
    front_default: string;
    back_default: string;
  };
  types: Array<{ type: { name: string } }>;
  height: number;
  weight: number;
}

export default function Details() {
  const params = useLocalSearchParams();
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPokemonByName(params.name as string); // Changed from params.name[0]
  }, []);

  async function fetchPokemonByName(name: string){
   try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${name}`
    );
    const data = await response.json(); // Added () here
    
    setPokemon(data);
    console.log(data);
   }
   catch(error){
     console.log(error);
   }
   finally {
     setLoading(false);
   }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!pokemon) {
    return (
      <View style={styles.centerContainer}>
        <Text>Pokémon not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
    contentContainerStyle={{
      gap: 16,
      padding: 16,
    }}
    >
       <Text style={styles.name}>{pokemon.name}</Text>
       
       <View style={styles.imageContainer}>
         <Image 
           source={{ uri: pokemon.sprites.front_default }} 
           style={styles.image} 
         />
         <Image 
           source={{ uri: pokemon.sprites.back_default }} 
           style={styles.image} 
         />
       </View>

       <View style={styles.infoBox}>
         <Text style={styles.label}>Type:</Text>
         <Text style={styles.value}>
           {pokemon.types.map(t => t.type.name).join(', ')}
         </Text>
       </View>

       <View style={styles.infoBox}>
         <Text style={styles.label}>Height:</Text>
         <Text style={styles.value}>{pokemon.height / 10} m</Text>
       </View>

       <View style={styles.infoBox}>
         <Text style={styles.label}>Weight:</Text>
         <Text style={styles.value}>{pokemon.weight / 10} kg</Text>
       </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 150,
    height: 150,
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    textTransform: 'capitalize',
  },
});