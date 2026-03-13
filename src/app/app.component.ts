import { Component, effect, inject } from '@angular/core';
import { BackgroundComponent } from './components/background/background.component';
import { DeviceService } from './services/device.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BackgroundComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'cops-and-robbers';

  device = inject(DeviceService);

  constructor() {
  //   effect(() => {
  //     // If a desktop user resizes to portrait etc for windowing purposes it will be treated here as mobile or tablet
  //     switch (this.device.type()) {
  //       case 'mobile':
  //         switch (this.device.orientation()) {
  //           case 'portrait':
  //             console.log("TYPE: 1");
  //             break;
  //           case 'landscape':
  //             console.log("TYPE: 2");
  //             break;
  //         }
  //         break;
  //       case 'tablet':
  //         switch (this.device.orientation()) {
  //           case 'portrait':
  //             console.log("TYPE: 3");
  //             break;
  //           case 'landscape':
  //             console.log("TYPE: 4");
  //             break;
  //         }
  //         break;
  //       case 'desktop':
  //         console.log("TYPE: 5");
  //         break;
  //     }
  //   });
  }

}
