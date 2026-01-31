import axios from 'axios';

export function axiosInstanceSetup(port: number) {
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${port}`,
    validateStatus: () => true,
  };
  const axiosInstance = axios.create(axiosConfig);
  return axiosInstance;
}
