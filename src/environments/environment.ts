export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  useMocks: false,
  autoSaveIntervalMs: 10 * 60 * 1000, // 10 minutes — lower this locally to test auto-save/reminder ticks faster
  rsaPublicKey: 'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtAThUTvJzLZPSy+e73u6+VpGPQ+A/L7DNbn36F29zoErnyB4gZOFoUsvkZPwC43Zy2v5FOew+AZwh4USNjiEljzWHWpcOOrkoY5EqsLjDlxi38zj5rMF2STq8lL7wsVapopcPqNE+vtejenzHOP1xJC1U5u0osXpWt8cU1iMBP6zd1wFYlHDviUV/i4EF0bVY7gKMbwn5NBCK4+0b2Ow106ZjLwMC5Ea1ZB7oomR1haA31EivKXEieDJ9EY74dSx5ID2mZYb3wHW9JNvAgPUAQ7RjtUog5tNmRSqyv24977H0/CA7GvhU0jw7mAFK2m2jLd862hK+JlRePe90uGx+m9epk+itYq0wIArnI17V3Xjr5ZJDLMoa59kmtE1xPt3Q/PBABROqgdUBPi/t+iLr+g4Td5iNFqDrqUYmLLj61g4cOeRCXDpCdV+mzvhD9tfhE68J9Ec1LOTDoHiH8AcZQFhJm1fdhVQRomk8YCTR485KWg9CXQacuBWGo7hkf+amryCW1wdkA63GDyJ189nAtEHBpqEHUR+VEM8ExL4zw1INsNTO/4PrvFZIPzDvGno08eYRQwU1X0nbU1+mN3MEORcQrmB2yxvl8MRLkbXgnQwGEZlXBlqzaN0EYB8Mif+nPEH7N8k2RO8RnpGRA/r1xxTUJEyCGvlTafybA6rO98CAwEAAQ==',
  turnstileSiteKey: '1x00000000000000000000AA',
  paypalClientId: '',  // empty in dev — PayPal button is skipped in mock mode
};
