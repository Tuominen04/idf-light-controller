import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 5,
  },
  scanningText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  scanningSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
    alignSelf: 'center',
  },
  noDevicesText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  scanButton: {
    color: '#ffffffff', 
    fontWeight: 'bold',
    fontSize: 18,
    paddingHorizontal: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  deviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  rssiContainer: {
    marginLeft: 10,
  },
  rssiText: {
    fontSize: 14,
    color: '#999',
  },
});
