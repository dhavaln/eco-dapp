import React from "react";
import Modal from 'react-bootstrap/Modal';
import { Button } from 'react-bootstrap';

class CreateVestingManagerModal extends React.Component {
    constructor( props ){
        super(props);

        this.state = {
            name: this.props.name,
            erc20Address: this.props.erc20Address       
        };
    }

    onClose = () => {
        this.props.onClose(false)
    }

    onCreate = () => {
        this.props.onCreate({...this.state});
    }

    onChange =(fname) =>(event) => {
        const{value}=event.target;
        
        this.setState({
            [fname]:value
        });
    }

    render( ) {
        return (
            <Modal show={this.props.show} >
                <Modal.Header>
                    <Modal.Title>Create VestingManager</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <div className="form-group">
                            <label htmlFor="vestingName">Company Name</label>
                            <input type="text" className="form-control" id="tokenName" aria-describedby="vestingName" placeholder="Company" value={ this.state.name } onChange={ this.onChange('name') }/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="vestingToken">Company Token Address</label>
                            <input type="text" className="form-control" id="tokenSymbol" aria-describedby="vestingToken" placeholder="ERC20 Token Address" value={ this.state.erc20Address } onChange={ this.onChange('erc20Address') } />
                        </div>                        
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={this.onClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={this.onCreate} >
                        Create
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
};

export default CreateVestingManagerModal;