import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { EgldController } from '../../module';

@Controller()
export class AppController extends EgldController {
  constructor(private readonly egldService: AppService) {
    super(egldService);
  }
}
