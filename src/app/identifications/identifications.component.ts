import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-identifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './identifications.component.html',
  styleUrls: ['./identifications.component.scss']
})
export class IdentificationsComponent implements OnInit {
  guildBlocks: any[] = [];

  ngOnInit() {
    this.refreshIdentifications();
  }

  refreshIdentifications() {
    // Données fictives pour l'exemple
    this.guildBlocks = [
      {
        guildName: 'Serveur de test',
        searchTerm: '',
        currentPage: 1,
        totalPages: 1,
        pageSize: 10,
        identifications: [
          { userName: 'Jean Dupont', type: 'Carte', date: new Date() },
          { userName: 'Alice Martin', type: 'Badge', date: new Date() }
        ]
      }
    ];
  }

  onGuildSearch(guild: any) {
    // Ici tu pourras filtrer les identifications selon guild.searchTerm
  }

  confirmDeleteIdentification(identification: any) {
    // Logique de suppression à ajouter
    alert('Suppression de ' + identification.userName);
  }

  prevGuildPage(guild: any) {}
  nextGuildPage(guild: any) {}
  loadGuildIdentifications(guild: any, page: number, pageSize: number, searchTerm: string) {}

  acceptIdentification(identification: any) {
    // Logique d'acceptation à implémenter
    alert('Identification acceptée pour ' + identification.firstName + ' ' + identification.lastName);
  }

  refuseIdentification(identification: any) {
    // Logique de refus à implémenter
    alert('Identification refusée pour ' + identification.firstName + ' ' + identification.lastName);
  }
}
