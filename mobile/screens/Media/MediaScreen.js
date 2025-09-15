import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MediaScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Media Gallery Screen</Text>
      <Text style={styles.subtext}>// TODO: Implement media gallery with grid view</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default MediaScreen;
