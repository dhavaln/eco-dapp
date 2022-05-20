import React from "react";
import Modal from 'react-bootstrap/Modal';
import { Button } from 'react-bootstrap';

class TokanTransferModal extends React.Component {
    constructor( props ){
        super(props);

        this.state = {            
            tokens: 0            
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
                    <Modal.Title>Add Member for Vesting</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <div className="form-group">
                            <label htmlFor="tokens">Tokens To Transfer</label>
                            <input type="text" className="form-control" id="tokens" aria-describedby="tokens" placeholder="Total tokens to transfer" value={ this.state.tokens } onChange={ this.onChange('tokens') } />
                        </div>                        
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={this.onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={this.onCreate} >
                        Initiate Transfer
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
};

export default TokanTransferModal;