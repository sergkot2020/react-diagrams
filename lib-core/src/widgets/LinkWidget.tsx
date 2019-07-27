import * as React from 'react';
import { DiagramEngine } from '../DiagramEngine';
import { LinkModel } from '../models/LinkModel';
import { ListenerHandle } from '../core/BaseObserver';
import { BaseEntityEvent } from '../core-models/BaseEntity';
import { BasePositionModel } from '../core-models/BasePositionModel';

export interface LinkProps {
	link: LinkModel;
	diagramEngine: DiagramEngine;
}

export interface LinkState {
	sourceID: string;
	targetID: string;
}

export class LinkWidget extends React.Component<LinkProps, LinkState> {
	sourceListener: ListenerHandle;
	targetListener: ListenerHandle;

	constructor(props) {
		super(props);
		this.state = {
			sourceID: null,
			targetID: null
		};
	}

	componentWillUnmount(): void {
		if (this.sourceListener) {
			this.sourceListener.deregister();
		}
		if (this.targetListener) {
			this.targetListener.deregister();
		}
	}

	static getDerivedStateFromProps(nextProps: LinkProps, prevState: LinkState): LinkState {
		const s = nextProps.link.getSourcePort();
		const t = nextProps.link.getTargetPort();
		return {
			sourceID: s && s.getID(),
			targetID: t && t.getID()
		};
	}

	ensureInstalled(installSource: boolean, installTarget: boolean) {
		if (installSource) {
			this.sourceListener = this.props.link.getSourcePort().registerListener({
				reportInitialPosition: (event: BaseEntityEvent<BasePositionModel>) => {
					this.forceUpdate();
				}
			});
		}

		if (installTarget) {
			this.targetListener = this.props.link.getTargetPort().registerListener({
				reportInitialPosition: (event: BaseEntityEvent<BasePositionModel>) => {
					this.forceUpdate();
				}
			});
		}
	}

	componentDidUpdate(prevProps: Readonly<LinkProps>, prevState: Readonly<LinkState>, snapshot?: any): void {
		let installSource = false;
		let installTarget = false;
		if (this.state.sourceID !== prevState.sourceID) {
			this.sourceListener && this.sourceListener.deregister();
			installSource = true;
		}
		if (this.state.targetID !== prevState.targetID) {
			this.targetListener && this.targetListener.deregister();
			installTarget = true;
		}
		this.ensureInstalled(installSource, installTarget);
	}

	componentDidMount(): void {
		this.ensureInstalled(!!this.props.link.getSourcePort(), !!this.props.link.getTargetPort());
	}

	render() {
		const { link } = this.props;

		// only draw the link when we have reported positions
		if (link.getSourcePort() && !link.getSourcePort().reportedPosition) {
			return null;
		}
		if (link.getTargetPort() && !link.getTargetPort().reportedPosition) {
			return null;
		}

		//generate links
		return this.props.diagramEngine.generateWidgetForLink(link);
	}
}
