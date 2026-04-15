import { Pipe, PipeTransform } from '@angular/core';
import { OperationalStatus } from '../../features/admin/admin.service';

@Pipe({ name: 'operationalStatus', standalone: true })
export class OperationalStatusPipe implements PipeTransform {
  transform(status: OperationalStatus): { label: string; color: string; icon: string } {
    const map: Record<OperationalStatus, { label: string; color: string; icon: string }> = {
      AKTIV:           { label: 'Aktiv',            color: 'green',  icon: 'check_circle' },
      EINGESCHRAENKT:  { label: 'Eingeschränkt',    color: 'orange', icon: 'warning' },
      GESPERRT:        { label: 'Gesperrt',         color: 'red',    icon: 'lock' },
      WARTUNG:         { label: 'Wartung',          color: 'orange', icon: 'build' },
      AUSSER_BETRIEB:  { label: 'Außer Betrieb',    color: 'grey',   icon: 'cancel' },
    };
    return map[status] || map.AKTIV;
  }
}
