import { Injectable } from '@angular/core';
import 'amazon-connect-streams';
import { BehaviorSubject, connectable, Observable } from 'rxjs';
import { Agent } from './agentinterface/agentinterface.component';
import 'amazon-connect-streams';
import * as AWS from 'aws-sdk';
import { Connect } from 'aws-sdk'; 


@Injectable({
  providedIn: 'root',
})
export class StreamsApiService {
  private contactAttributesSubject = new BehaviorSubject<any>(null);
  private incomingCallSubject = new BehaviorSubject<{callerNumber: string;incomingCall: boolean;} | null>(null);
  private callStateSubject = new BehaviorSubject<string>('');
  private agentNameSubject = new BehaviorSubject<string>('');
  private dialStringSubject = new BehaviorSubject<string>('');
  private quickConnectsSubject = new BehaviorSubject<any[]>([]); 

  private localStream: MediaStream | null = null;
  callerNumber!: string;
  incomingCall = false;
  selectedCountryCode = '+1'; 
  currentDialString = '';
  quickConnects: any[] = []; 
  isOnCall: boolean = false; 
  getContactAttributes(): Observable<any> {
    return this.contactAttributesSubject.asObservable();
  }
  getIncomingCall(): Observable<{
    callerNumber: string;
    incomingCall: boolean;
  } | null> {
    return this.incomingCallSubject.asObservable();
  }
  getCallState(): Observable<string> {
    return this.callStateSubject.asObservable();
  }
  getAgentName(): Observable<string> {
    return this.agentNameSubject.asObservable();
  }
  async initCCP(containerDiv: HTMLElement) {
    try {
      connect.core.initCCP(containerDiv, {
        ccpUrl: 'https://sparthoughtscontactcenter.my.connect.aws/ccp-v2',
        loginPopup: true,
        loginPopupAutoClose: true,
        storageAccess: {
          canRequest: true,
          mode: 'custom',
          custom: {
            header: 'Action Required !!',
            title: 'Allow access to cookies',
            accessBannerDescription:
              'As per Chrome policy, Harmony now explicitly requires permission to access cookies. Please request access by clicking the below "Grant Access" button and "Allow" your browser permissions.',
            denyBannerDescription:
              "You can't access Harmony because permission to access cookies is denied. Please navigate to chrome://settings/content/storageAccess and delete connect.aws from the Not Allowed list. After this, please request access by clicking the below 'Try Again' button and 'Allow' your browser permissions.",
            accessBannerButtonText: 'Grant access',
            denyBannerButtonText: 'Try Again',
          },
          style: {
            'font-family': 'sans-serif',
            'primary-color': '#007bff',
            'primary-button-hover-color': '#034861',
            'link-color': '#0078c3',
            'banner-header-color': '#212529',
            'banner-title-color': '#212529',
            'banner-request-access-description-color': '#0c5460',
            'banner-request-access-background': '#d1ecf1',
            'banner-request-deny-background': 'yellow',
            'banner-box-shadow': 'none',
            'banner-margin': '15px',
            'border-radius': '0.25rem',
            'banner-request-access-icon-color': '#007bff',
            'banner-request-deny-icon-color': 'green',
            'banner-request-deny-description-color': 'red',
            'line-height': '25px',
            'banner-description-font-size': '14px',
            'banner-icon-display': 'block',
            'header-font-size': '2rem',
            'bold-font-weight': '1000',
          },
        },
      });
      connect.agent((agent) => {
        this.agentNameSubject.next(agent.getName());
      });
      connect.contact((contact: any) => {
        contact.onConnecting(() => {
          this.updateCallState('connecting');
        });
        contact.onConnected(() => {
          this.updateCallState('connected');
          contact
            .getAttributes()
            .then((attributes: any) => {
              this.contactAttributesSubject.next(attributes);
            })
            .catch((err: any) =>
              console.error('Error retrieving attributes', err)
            );
          this.localStream = contact
            .getInitialConnection()
            .getMediaInfo().localStream;
        });
        contact.onEnded(() => {
          this.updateCallState('ended');
          this.localStream = null;
        });
      });
      this.monitorIncomingCalls();
    } catch (error) {
      console.error('Error initializing CCP:', error);
    }
  }
  private updateCallState(state: string) {
    this.callStateSubject.next(state);
  }
  answerCall(): void {
    connect.agent((agent) => {
      const activeContact = agent.getContacts()[0];
      if (activeContact && activeContact.getState().type === 'connecting') {
        activeContact.accept();
      }
    });
  }
  holdCall(): void {
    connect.agent((agent) => {
      const activeContact = agent.getContacts()[0];
      const activeConnection = activeContact?.getActiveInitialConnection();
      if (
        activeConnection &&
        activeConnection.getState().type === 'connected'
      ) {
        activeConnection.hold({
          success: () => console.log('Call is on hold'),
          failure: (error) =>
            console.error('Failed to put call on hold', error),
        });
      }
    });
  }
  resumeCall(): void {
    connect.agent((agent) => {
      const activeContact = agent.getContacts()[0];
      const activeConnection = activeContact?.getActiveInitialConnection();
      if (activeConnection && activeConnection.getState().type === 'hold') {
        activeConnection.resume({
          success: () => console.log('Call resumed from hold'),
          failure: (error) =>
            console.error('Failed to resume call from hold', error),
        });
      }
    });
  }
  rejectCall(): void {
    connect.agent((agent) => {
      const activeContact = agent.getContacts()[0];
      if (activeContact) {
        const activeConnection = activeContact.getActiveInitialConnection();
        if (
          activeConnection &&
          (activeConnection.getState().type === 'connected' ||
            activeConnection.getState().type === 'hold')
        ) {
          activeConnection.destroy({
            success: () => console.log('Call rejected successfully'),
            failure: (error) =>
              console.error('Failed to reject the call', error),
          });
        } else {
          console.log('No incoming call to reject');
        }
      } else {
        console.log('No active contact found');
      }
    });
  }
  closeCall(): void {
    connect.agent((agent) => {
      const activeContact = agent.getContacts()[0];
      if (
        activeContact &&
        (activeContact.getState().type === 'error' ||
          activeContact.getState().type === 'ended')
      ) {
        activeContact.clear({
          success: () => console.log('Call cleared successfully'),
          failure: (error) => console.error('Failed to clear the call', error),
        });
      }
    });
  }
  muteCall(): void {
    connect.agent((agent) => {
      const activeContact = agent.mute();
    });
  }
  unmuteCall(): void {
    connect.agent((agent) => {
      const activeContact = agent.unmute();
    });
  }
  endCall(): void {
    connect.agent((agent) => {
      const activeContact = agent.getContacts()[0];
      if (activeContact) {
        const activeConnection = activeContact.getActiveInitialConnection();
        if (
          activeConnection &&
          (activeConnection.getState().type === 'connected' ||
            activeConnection.getState().type === 'hold')
        ) {
          activeConnection.destroy({
            success: () => console.log('Call ended successfully'),
            failure: (error) => console.error('Failed to end the call', error),
          });
        } else {
          console.log('No incoming call to end');
        }
      } else {
        console.log('No active contact found');
      }
    });
  }
  monitorIncomingCalls() {
    connect.contact((contact: connect.Contact) => {
      if (contact.getType() === connect.ContactType.VOICE) {
        this.incomingCall = true;
        this.callerNumber =
          contact.getInitialConnection().getEndpoint().phoneNumber || 'Unknown';
        console.log('callerNumber', this.callerNumber);
        this.incomingCallSubject.next({
          callerNumber: this.callerNumber,
          incomingCall: true,
        });
      }
    });
  }
  

  getAvailableAgents(): Observable<any[]> {
    return new Observable((observer) => {
      console.log('Fetching available agents from API...');
      
      fetch('https://f3w9xal177.execute-api.ca-central-1.amazonaws.com/dev/agents') 
        .then(response => {
          console.log('API response status:', response.status); 
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
          }
          return response.json(); 
        })
        .then(data => {
          console.log('Full API response:', data); 
          
          const parsedBody = JSON.parse(data.body);
          
          if (parsedBody && parsedBody.agents) {
            console.log('Agents data found:', parsedBody.agents);
            observer.next(parsedBody.agents); 
            observer.complete();              
          } else {
            console.error('Agents data is missing from response:', parsedBody); 
            throw new Error('Agents data is missing from response.');
          }
        })
        .catch(error => {
          console.error('Failed to fetch available agents:', error);
          observer.error(error); 
        });
      });
  }
  
  
  setDialString(dialString: string): void {
    this.dialStringSubject.next(dialString);
  }

  getDialString(): Observable<string> {
    return this.dialStringSubject.asObservable();
  }

}