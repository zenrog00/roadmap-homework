import { ConfigurableModuleBuilder } from '@nestjs/common';
import { AuthModuleOptions } from './common/options';

export const {
  ConfigurableModuleClass: ConfigurableAuthModule,
  MODULE_OPTIONS_TOKEN: AUTH_MODULE_OPTIONS,
} = new ConfigurableModuleBuilder<AuthModuleOptions>()
  .setClassMethodName('forRoot')
  .setFactoryMethodName('createAuthModuleOptions')
  .build();
