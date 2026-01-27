import { StyleSheet, Text, View } from 'react-native';

export function AdBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ad Space</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    color: '#999999',
  },
});

