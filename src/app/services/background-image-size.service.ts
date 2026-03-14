import { inject, Injectable } from '@angular/core';
import { DeviceService } from './device.service';

@Injectable({ providedIn: 'root' })
export class BackgroundImageSizeService {

  device = inject(DeviceService);

  getBackgroundImageSize() {
    let bgImageWidth: number, bgImageHeight: number;
    if (this.device.isMobile()) {
      if (this.device.isPortrait()) {
        bgImageWidth = 750;
        bgImageHeight = 1334;
      } else {
        bgImageWidth = 1334;
        bgImageHeight = 750;
      }
    } else {
      if (this.device.isTablet()) {
        if (this.device.isPortrait()) {
          bgImageWidth = 768;
          bgImageHeight = 1024;
        } else {
          bgImageWidth = 1024;
          bgImageHeight = 768;
        }
      } else {
        bgImageWidth = 1920;
        bgImageHeight = 1080;

      }
    }

    console.log("bgImageWidth", bgImageWidth);
    console.log("bgImageHeight", bgImageHeight);
    return {
      bgImageWidth: bgImageWidth,
      bgImageHeight: bgImageHeight
    };
  }

}