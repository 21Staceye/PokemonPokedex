import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

interface Pokemon {
  name: string;
  image: string;
  imageBack: string;
  types: PokemonTypes[];
}

interface PokemonTypes {
  type: {
    name: string;
    url: string;
  }
}

const colorsByType: Record<string, string> = {
  grass: "#7AC74C",
  fire: "#EE8130",
  water: "#6390F0",
  flying: "#A98FF3",
  normal: "#A8A77A",
  electric: "#F7D02C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
}

const ITEMS_PER_PAGE = 20;

export default function Index() {
  const [pokemon, setPokes] = useState<Pokemon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchPoke(0);
  }, []);

  async function searchPokemon(query: string) {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`);
      
      if (response.ok) {
        const details = await response.json();
        const pokemon: Pokemon = {
          name: details.name,
          image: details.sprites.front_default,
          imageBack: details.sprites.back_default,
          types: details.types,
        };
        setSearchResults([pokemon]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.log(error);
      setSearchResults([]);
    }
  }

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    if (text.trim()) {
      // Debounce search
      const timeoutId = setTimeout(() => {
        searchPokemon(text);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setSearching(false);
    }
  };

  async function fetchPoke(currentOffset: number) {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${ITEMS_PER_PAGE}&offset=${currentOffset}`
      );
      const data = await response.json();
      
      if (data.results.length === 0) {
        setHasMore(false);
        setLoading(false);
        return;
      }
     
      const detailedPokemons = await Promise.all(
        data.results.map(async (pokemon: any) => {
          const res = await fetch(pokemon.url);
          const details = await res.json();
          return {
            name: pokemon.name,
            image: details.sprites.front_default,
            imageBack: details.sprites.back_default,
            types: details.types,
          };
        })
      );
      
      setPokes(prev => {
        // Filter out duplicates by checking if pokemon name already exists
        const existingNames = new Set(prev.map(p => p.name));
        const newPokemon = detailedPokemons.filter(p => !existingNames.has(p.name));
        return [...prev, ...newPokemon];
      });
      setOffset(currentOffset + ITEMS_PER_PAGE);
      
      // Check if we've reached the end (there are 1025+ Pokémon total)
      if (data.next === null) {
        setHasMore(false);
      }
      
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Check if we have valid measurements
    if (!layoutMeasurement || !contentOffset || !contentSize) return;
    
    const paddingToBottom = 100;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && !loading && hasMore) {
      fetchPoke(offset);
    }
  };

  // Display search results if searching, otherwise show all loaded pokemon
  const displayedPokemon = searchQuery.trim() ? searchResults : pokemon;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Pokémon by name..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      
      <ScrollView
        contentContainerStyle={{
          gap: 16,
          padding: 16,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {displayedPokemon.length > 0 ? (
          <>
            {displayedPokemon.map((pokemo) => (
              <Link 
                key={pokemo.name}
                href={{ pathname: "/details", params: { name: pokemo.name } }}
                style={{
                  backgroundColor: `${colorsByType[pokemo.types[0].type.name]}30`,
                  padding: 20,
                  borderRadius: 20,
                  margin:"auto",
                }}
              >
                <View>
                  <Text style={styles.name}>{pokemo.name}</Text>
                  <View style={{  
                    flexDirection: "row",
                  }}>
                    <Image
                      source={{ uri: pokemo.image }}
                      style={{ width: 150, height: 150 }}
                    />
                   
                  </View>
                </View>
              </Link>
            ))}
            
            {loading && !searchQuery && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading more Pokémon...</Text>
              </View>
            )}
            
            {!hasMore && !loading && !searchQuery && (
              <Text style={styles.endText}>
                You've caught 'em all! 🎉
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.noResults}>
            {searchQuery ? `No Pokémon found matching "${searchQuery}"` : "Loading..."}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  name: {
    fontSize: 35,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  type: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'grey',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  noResults: {
    textAlign: 'center',
    fontSize: 18,
    color: 'grey',
    marginTop: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'grey',
  },
  endText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'grey',
    padding: 20,
  }
})