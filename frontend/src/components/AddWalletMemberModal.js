import React from "react";
import Modal from 'react-bootstrap/Modal';
import { Button } from 'react-bootstrap';

class AddWalletMemberModal extends React.Component {
    constructor( props ){
        super(props);

        this.state = {
            address: "",
            totalTokens: 100000,            
            transferOn: new Date()
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
                            <label htmlFor="address">Wallet Address</label>
                            <input type="text" className="form-control" id="address" aria-describedby="address" placeholder="Wallet address of the member" value={ this.state.address } onChange={ this.onChange('address') }/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="totalTokens">Tokens To Transfer</label>
                            <input type="text" className="form-control" id="totalTokens" aria-describedby="totalTokens" placeholder="Total tokens to vest" value={ this.state.totalTokens } onChange={ this.onChange('totalTokens') } />
                        </div>
                        <div className="form-group">
                            <label htmlFor="tokenSupply">Vesting Date</label>            
                            <input type="date" className="form-control" id="transferOn" aria-describedby="transferOn" placeholder="Date on which tokens will be vested" value={ this.state.transferOn } onChange={ this.onChange('transferOn') }/>
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

export default AddWalletMemberModal;