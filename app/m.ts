import {Injectable} from "angular2/core";
import {Message} from "./model/Message"

/**
 * This map contains the message bodies
 * messages identified by their key.
 * It can be replaced later by another data source
 * like an external service.
 *
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
@Injectable()
export class M { // = Messages Dictionary. For reasons of brevity of calls to it just "M".

    public static OBJLIST_IDEXISTS : string = 'objectlist/idexists';
    public static OBJLIST_IDMISSING : string = 'objectlist/idmissing';
    public static OBJLIST_SAVE_SUCCESS : string = 'objectlist/savesuccess';
    public static MESSAGES_NOBODY : string = 'messages/nobody';
    public static PC_GENERIC_ERROR : string = 'pmc/generic';
    public static PARSE_GENERIC_ERROR : string = 'parse/generic';

    public msgs : { [id: string]: Message } = {};

    constructor() {
        this.msgs[M.OBJLIST_IDEXISTS]={
            content: 'Objekt Identifier existiert bereits.',
            level: 'danger',
        };
        this.msgs[M.OBJLIST_IDMISSING]={
            content: 'Objekt Identifier fehlt.',
            level: 'danger'
        };
        this.msgs[M.OBJLIST_SAVE_SUCCESS]={
            content: 'Das Objekt wurde erfolgreich gespeichert.',
            level: 'success'
        };
        this.msgs[M.MESSAGES_NOBODY]={
            content: "Kein Message gefunden für Schlüssel 'id'.",
            level: 'danger'
        };
        this.msgs[M.PC_GENERIC_ERROR]={
            content: "Fehler beim Auswertenwerten eines Konfigurationsobjektes.",
            level: 'danger'
        };
        this.msgs[M.PARSE_GENERIC_ERROR]={
            content: "Fehler beim Parsen einer Konfigurationsdatei.",
            level: 'danger'
        };
    }
}