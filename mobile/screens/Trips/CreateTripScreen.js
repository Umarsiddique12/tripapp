import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { tripsService } from '../../api/trips';
import moment from 'moment';

const CreateTripScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    totalBudget: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Trip name is required');
      return;
    }

    setIsLoading(true);

    try {
      const tripData = {
        ...formData,
        totalBudget: formData.totalBudget ? parseFloat(formData.totalBudget) : 0
      };

      const response = await tripsService.createTrip(tripData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Trip created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('TripDetails', { 
                tripId: response.data.trip._id 
              })
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create trip');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create trip');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Trip Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter trip name"
              maxLength={100}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Describe your trip..."
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Destination</Text>
            <TextInput
              style={styles.input}
              value={formData.destination}
              onChangeText={(value) => handleInputChange('destination', value)}
              placeholder="Where are you going?"
              maxLength={100}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Start Date</Text>
              <TextInput
                style={styles.input}
                value={formData.startDate}
                onChangeText={(value) => handleInputChange('startDate', value)}
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>End Date</Text>
              <TextInput
                style={styles.input}
                value={formData.endDate}
                onChangeText={(value) => handleInputChange('endDate', value)}
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Total Budget</Text>
            <TextInput
              style={styles.input}
              value={formData.totalBudget}
              onChangeText={(value) => handleInputChange('totalBudget', value)}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Trip</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateTripScreen;
