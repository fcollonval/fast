import { attr, DOM, FASTElement, observable } from "@microsoft/fast-element";
// TODO: the Resize Observer related files are a temporary stopgap measure until
// Resize Observer types are pulled into TypeScript, which seems imminent
// At that point these files should be deleted.
// https://github.com/microsoft/TypeScript/issues/37861
import {
    ConstructibleResizeObserver,
    ResizeObserverClassDefinition,
} from "../anchored-region/resize-observer";
import { ResizeObserverEntry } from "../anchored-region/resize-observer-entry";
import { ScrollerControlStyles } from "./scroller.styles";

declare global {
    interface WindowWithResizeObserver extends Window {
        ResizeObserver: ConstructibleResizeObserver;
    }
}

export type ScrollerView = "default" | "mobile";

export class Scroller extends FASTElement {
    public content: HTMLDivElement;
    public previousFlipper: HTMLDivElement;
    public nextFlipper: HTMLDivElement;

    /**
     * indicates that an initial positioning pass on layout has completed
     *
     * @internal
     */
    @observable
    public initialLayoutComplete: boolean = false;

    private resizeDetector: ResizeObserverClassDefinition | null = null;

    /**
     * Current scroll position
     * @internal
     */
    @attr
    private position: number;

    /**
     * Width of the parent container
     * @internal
     */
    @attr
    private width: number;

    /**
     * Scroll stop positions between elements
     * @internal
     */
    @attr
    private scrollStops: Array<number>;

    /**
     * View: default | mobile
     */
    @attr({
        attribute: "view",
    })
    public view: ScrollerView;

    /**
     * @internal
     */
    public connectedCallback(): void {
        super.connectedCallback();
        if (this.view !== "mobile") {
            this.$fastController.addStyles(ScrollerControlStyles);
        }

        DOM.queueUpdate(this.moveToStart.bind(this));
        this.initializeResizeDetector();
        this.startObservers();
    }

    /**
     * @internal
     */
    public disconnectedCallback(): void {
        super.disconnectedCallback();

        this.disconnectResizeDetector();
    }

    /**
     * Starts observers
     */
    private startObservers = (): void => {
        this.stopObservers();

        if (this.resizeDetector !== null) {
            this.resizeDetector.observe(this);
        }
    };

    /**
     * Stops observers
     */
    private stopObservers = (): void => {
        if (this.resizeDetector !== null) {
            this.resizeDetector.disconnect();
        }
    };

    /**
     * destroys the instance's resize observer
     */
    private disconnectResizeDetector(): void {
        this.stopObservers();

        if (this.resizeDetector !== null) {
            this.resizeDetector.disconnect();
            this.resizeDetector = null;
        }
    }

    /**
     * initializes the instance's resize observer
     */
    private initializeResizeDetector(): void {
        this.disconnectResizeDetector();
        this.resizeDetector = new ((window as unknown) as WindowWithResizeObserver).ResizeObserver(
            this.handleResize.bind(this)
        );
    }

    /**
     *  Handle resize events
     */
    private handleResize = (entries: ResizeObserverEntry[]): void => {
        entries.forEach((entry: ResizeObserverEntry) => {
            if (entry.target === this) {
                this.moveToStart();
            }
        });
    };

    /**
     * Finds all of the scroll stops between elements
     */
    private setStops(): void {
        this.scrollStops = [].slice
            .call(this.children)
            .map(el => ({ left: el.offsetLeft, right: el.offsetLeft + el.offsetWidth }))
            .map(
                (el, index, items) =>
                    el.right -
                    (index < items.length - 1
                        ? Math.floor((el.right - items[index + 1].left) / 2)
                        : 0)
            );

        /* The first stop should be zero */
        this.scrollStops.splice(0, 0, 0);
    }

    /**
     * Sets the controls view if enabled
     */
    private setFlippers(): void {
        const enabledCn: string = "show";
        const disabledCn: string = "hide";
        const setClassName: (HTMLElement, boolean) => void = (
            elm: HTMLElement,
            isEnabled: boolean
        ) => {
            if (elm && elm.className) {
                if (isEnabled) {
                    elm.className = elm.className.replace(disabledCn, enabledCn);
                } else {
                    elm.className = elm.className.replace(enabledCn, disabledCn);
                }
            }
        };
        const hasLeft: boolean = this.position > 0;
        const lastStop: number = this.scrollStops[this.scrollStops.length - 1];
        const hasRight: boolean = this.position + this.width < lastStop;
        setClassName(this.previousFlipper, hasLeft);
        setClassName(this.nextFlipper, hasRight);
    }

    /**
     * Scrolls items to the left
     */
    public scrollToPrevious(): void {
        const right = this.scrollStops[
            this.scrollStops.findIndex((stop: number) => stop === this.position) + 1
        ];
        const left: number =
            this.scrollStops.find((stop: number) => stop + this.width > right) || 0;
        this.content.style.transform = `translate3d(-${left}px, 0, 0)`;
        this.position = left;
        this.setFlippers();
    }

    /**
     * Scrolls items to the right
     */
    public scrollToNext(): void {
        const nextStop = this.scrollStops[
            (this.scrollStops.findIndex(
                (stop: number) => stop >= this.position + this.width
            ) || 2) - 2
        ];
        this.content.style.transform = `translate3d(-${nextStop}px, 0, 0)`;
        this.position = nextStop;
        this.setFlippers();
    }

    /**
     * Move the index back to 0
     */
    public moveToStart(): void {
        this.position = 0;
        this.content.style.transform = "translate3d(0, 0, 0)";
        this.width = this.offsetWidth;
        this.setStops();
        this.setFlippers();
    }
}