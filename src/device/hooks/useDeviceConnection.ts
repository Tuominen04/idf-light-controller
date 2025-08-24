export async function onRefresh(setRefreshing: (refreshing: boolean) => void, deviceConnectionHandler: () => Promise<void>) {
  setRefreshing(true);
  try {
    // Check connection and get light status
    await deviceConnectionHandler();
  } catch (error) {
    console.error('Refresh failed:', error);
  } finally {
    setRefreshing(false);
  }  
};